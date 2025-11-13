package com.cityasist.api;

import com.cityasist.api.dto.AssignRequest;
import com.cityasist.api.dto.IncidentCreateRequest;
import com.cityasist.api.dto.TimelineCreateRequest;
import com.cityasist.api.dto.IncidentStatusUpdateRequest;
import com.cityasist.api.dto.IncidentSeverityUpdateRequest;
import com.cityasist.domain.Incident;
import com.cityasist.domain.IncidentTimeline;
import com.cityasist.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentsController {
    private final IncidentService incidentService;

    public IncidentsController(IncidentService incidentService) { this.incidentService = incidentService; }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR','CITIZEN')")
    public Page<Incident> list(@RequestParam Optional<String> status,
                               @RequestParam Optional<String> severity,
                               @RequestParam Optional<String> zone,
                               @RequestParam Optional<Instant> from,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "20") int size) {
        return incidentService.list(status, severity, zone, from, page, size);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR','CITIZEN')")
    public ResponseEntity<Incident> create(@Valid @RequestBody IncidentCreateRequest req) {
        return ResponseEntity.ok(incidentService.create(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> get(@PathVariable UUID id) {
        return incidentService.get(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/number/{num}")
    public ResponseEntity<Incident> getByNumber(@PathVariable Long num) {
        return incidentService.getByNumber(num).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Incident> assign(@PathVariable UUID id, @Valid @RequestBody AssignRequest req) {
        return ResponseEntity.ok(incidentService.assign(id, UUID.fromString(req.getAssignedTo())));
    }
    @PostMapping("/number/{num}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Incident> assignByNumber(@PathVariable Long num, @Valid @RequestBody AssignRequest req) {
        return incidentService.getByNumber(num)
                .map(i -> ResponseEntity.ok(incidentService.assign(i.getId(), UUID.fromString(req.getAssignedTo()))))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/timeline")
    public ResponseEntity<IncidentTimeline> addTimeline(@PathVariable UUID id, @Valid @RequestBody TimelineCreateRequest req) {
        return ResponseEntity.ok(incidentService.addTimeline(id, req));
    }

    @GetMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR','CITIZEN')")
    public ResponseEntity<java.util.List<IncidentTimeline>> getTimeline(@PathVariable UUID id) {
        return ResponseEntity.ok(incidentService.timeline(id));
    }
    @GetMapping("/number/{num}/timeline")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR','CITIZEN')")
    public ResponseEntity<java.util.List<IncidentTimeline>> getTimelineByNumber(@PathVariable Long num) {
        return incidentService.getByNumber(num)
                .map(i -> ResponseEntity.ok(incidentService.timeline(i.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Incident> updateStatus(@PathVariable UUID id, @Valid @RequestBody IncidentStatusUpdateRequest req) {
        return ResponseEntity.ok(incidentService.updateStatus(id, req));
    }
    @PostMapping("/number/{num}/status")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Incident> updateStatusByNumber(@PathVariable Long num, @Valid @RequestBody IncidentStatusUpdateRequest req) {
        return incidentService.getByNumber(num)
                .map(i -> ResponseEntity.ok(incidentService.updateStatus(i.getId(), req)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/severity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Incident> updateSeverity(@PathVariable UUID id, @Valid @RequestBody IncidentSeverityUpdateRequest req) {
        return ResponseEntity.ok(incidentService.updateSeverity(id, req));
    }
    @PostMapping("/number/{num}/severity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Incident> updateSeverityByNumber(@PathVariable Long num, @Valid @RequestBody IncidentSeverityUpdateRequest req) {
        return incidentService.getByNumber(num)
                .map(i -> ResponseEntity.ok(incidentService.updateSeverity(i.getId(), req)))
                .orElse(ResponseEntity.notFound().build());
    }
}
