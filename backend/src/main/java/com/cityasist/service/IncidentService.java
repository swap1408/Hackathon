package com.cityasist.service;

import com.cityasist.api.dto.IncidentCreateRequest;
import com.cityasist.api.dto.TimelineCreateRequest;
import com.cityasist.api.dto.IncidentStatusUpdateRequest;
import com.cityasist.api.dto.IncidentSeverityUpdateRequest;
import com.cityasist.domain.Incident;
import com.cityasist.domain.IncidentTimeline;
import com.cityasist.repo.IncidentRepository;
import com.cityasist.repo.IncidentTimelineRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class IncidentService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(IncidentService.class);
    private final IncidentRepository incidentRepository;
    private final IncidentTimelineRepository timelineRepository;

    public IncidentService(IncidentRepository incidentRepository, IncidentTimelineRepository timelineRepository) {
        this.incidentRepository = incidentRepository;
        this.timelineRepository = timelineRepository;
    }

    public Page<Incident> list(Optional<String> status, Optional<String> severity, Optional<String> zone, Optional<Instant> from, int page, int size) {
        PageRequest pr = PageRequest.of(page, size);
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        UUID reporterIdFilter = null;
        if (auth != null && auth.isAuthenticated()) {
            boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + com.cityasist.domain.Role.ADMIN.name()));
            boolean isOperator = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + com.cityasist.domain.Role.OPERATOR.name()));
            if (isOperator && !isAdmin) {
                UUID uid = extractUserId(auth.getPrincipal());
                if (uid == null) return Page.empty(pr);
                // Operators only see incidents assigned to them
                return incidentRepository.findByAssignedTo(uid, pr);
            }
            if (!isAdmin) {
                // Citizens (and other roles) only see their own reported incidents
                reporterIdFilter = extractUserId(auth.getPrincipal());
                if (reporterIdFilter == null) {
                    return Page.empty(pr);
                }
            }
        } else {
            return Page.empty(pr);
        }
        // Always pass a non-null pattern to avoid PostgreSQL type inference issues
        String zonePattern = zone.filter(z -> !z.isBlank()).map(z -> "%" + z + "%").orElse("%");
        return incidentRepository.search(
                reporterIdFilter,
                status.orElse(null),
                severity.orElse(null),
                from.orElse(null),
                null,
                zonePattern,
                pr
        );
    }

    private java.util.UUID extractUserId(Object principal) {
        if (principal instanceof java.util.UUID u) return u;
        if (principal instanceof String s) {
            try { return java.util.UUID.fromString(s); } catch (Exception ignored) {}
        }
        return null;
    }

    private void ensureCanView(Incident i) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + com.cityasist.domain.Role.ADMIN.name()));
        if (isAdmin) return;
        java.util.UUID uid = auth != null ? extractUserId(auth.getPrincipal()) : null;
        boolean isOperator = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + com.cityasist.domain.Role.OPERATOR.name()));
        if (isOperator) {
            if (i.getAssignedTo() != null && uid != null && i.getAssignedTo().equals(uid)) return;
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }
        // fallback for other roles: must be reporter
        if (uid != null && uid.equals(i.getReporterId())) return;
        throw new org.springframework.security.access.AccessDeniedException("Forbidden");
    }

    @Transactional
    public Incident create(IncidentCreateRequest req) {
        Incident i = new Incident();
        i.setTitle(req.getTitle());
        i.setType(req.getType());
        i.setSeverity(req.getSeverity());
        i.setStatus(req.getStatus());
        i.setLocation(req.getLocation());
        i.setData(req.getData());
        i.setReportedAt(Instant.now());
        // Set reporter id from authenticated principal if available
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            java.util.UUID uid = extractUserId(auth.getPrincipal());
            if (uid != null) i.setReporterId(uid);
        }
        Incident saved = incidentRepository.save(i);
        log.info("Incident created id={} type={} severity={} status={} reporterId={}", saved.getId(), saved.getType(), saved.getSeverity(), saved.getStatus(), saved.getReporterId());
        return saved;
    }

    public Optional<Incident> get(UUID id) { return incidentRepository.findById(id); }
    public Optional<Incident> getByNumber(Long num) { return incidentRepository.findByIncidentNumber(num); }

    @Transactional
    public Incident assign(UUID id, UUID userId) {
        Incident i = incidentRepository.findById(id).orElseThrow();
        i.setAssignedTo(userId);
        Incident saved = incidentRepository.save(i);
        log.info("Incident assigned id={} assignedTo={}", id, userId);
        return saved;
    }

    @Transactional
    public IncidentTimeline addTimeline(UUID incidentId, TimelineCreateRequest req) {
        Incident i = incidentRepository.findById(incidentId).orElseThrow();
        // Only allow adding timeline if caller can view incident
        ensureCanView(i);
        IncidentTimeline t = new IncidentTimeline();
        t.setIncident(i);
        t.setTime(Instant.now());
        t.setActor(req.getActor());
        t.setText(req.getText());
        IncidentTimeline saved = timelineRepository.save(t);
        log.info("Timeline added incidentId={} actor={}", incidentId, req.getActor());
        return saved;
    }

    public java.util.List<IncidentTimeline> timeline(UUID incidentId) {
        Incident i = incidentRepository.findById(incidentId).orElseThrow();
        ensureCanView(i);
        return timelineRepository.findByIncidentIdOrderByTimeAsc(incidentId);
    }

    @Transactional
    public Incident updateStatus(UUID id, IncidentStatusUpdateRequest req) {
        Incident i = incidentRepository.findById(id).orElseThrow();
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + com.cityasist.domain.Role.ADMIN.name()));
        boolean isOperator = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + com.cityasist.domain.Role.OPERATOR.name()));
        UUID uid = (auth != null) ? extractUserId(auth.getPrincipal()) : null;
        if (isOperator && !isAdmin) {
            if (i.getAssignedTo() == null || uid == null || !i.getAssignedTo().equals(uid)) {
                throw new AccessDeniedException("Not allowed to update this incident");
            }
        }
        i.setStatus(req.getStatus());
        Incident saved = incidentRepository.save(i);
        // Add timeline entry
        IncidentTimeline t = new IncidentTimeline();
        t.setIncident(saved);
        t.setTime(Instant.now());
        t.setActor(isAdmin ? "admin" : "operator");
        String note = (req.getText() != null && !req.getText().isBlank()) ? req.getText() : ("Status updated to " + req.getStatus());
        t.setText(note);
        timelineRepository.save(t);
        log.info("Incident status updated id={} status={} by={}", id, req.getStatus(), uid);
        return saved;
    }

    @Transactional
    public Incident updateSeverity(UUID id, IncidentSeverityUpdateRequest req) {
        Incident i = incidentRepository.findById(id).orElseThrow();
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + com.cityasist.domain.Role.ADMIN.name()));
        if (!isAdmin) throw new AccessDeniedException("Only admin can update severity");
        i.setSeverity(req.getSeverity());
        Incident saved = incidentRepository.save(i);
        IncidentTimeline t = new IncidentTimeline();
        t.setIncident(saved);
        t.setTime(Instant.now());
        t.setActor("admin");
        String note = (req.getText() != null && !req.getText().isBlank()) ? req.getText() : ("Severity updated to " + req.getSeverity());
        t.setText(note);
        timelineRepository.save(t);
        log.info("Incident severity updated id={} severity={}", id, req.getSeverity());
        return saved;
    }
}
