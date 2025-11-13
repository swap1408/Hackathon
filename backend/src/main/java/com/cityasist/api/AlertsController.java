package com.cityasist.api;

import com.cityasist.api.dto.AlertCreateRequest;
import com.cityasist.domain.Alert;
import com.cityasist.repo.AlertRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertsController {
    private final AlertRepository alerts;
    private final com.cityasist.repo.AlertReadRepository alertReads;

    public AlertsController(AlertRepository alerts, com.cityasist.repo.AlertReadRepository alertReads) {
        this.alerts = alerts;
        this.alertReads = alertReads;
    }

    @GetMapping
    public Page<Alert> list(@RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "20") int size) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        java.util.UUID userId = null;
        if (auth != null && auth.isAuthenticated()) {
            Object p = auth.getPrincipal();
            if (p instanceof java.util.UUID u) userId = u;
            else if (p instanceof String s) { try { userId = java.util.UUID.fromString(s); } catch (Exception ignored) {} }
        }
        if (userId == null) {
            return alerts.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        }
        return alerts.findVisibleForUser(userId, PageRequest.of(page, size));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Alert> create(@Valid @RequestBody AlertCreateRequest req) {
        Alert a = new Alert();
        a.setType(req.getType());
        a.setTitle(req.getTitle());
        a.setMessage(req.getMessage());
        a.setSeverity(req.getSeverity());
        a.setZone(req.getZone());
        return ResponseEntity.ok(alerts.save(a));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable java.util.UUID id) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(401).build();
        java.util.UUID userId = null;
        Object p = auth.getPrincipal();
        if (p instanceof java.util.UUID u) userId = u;
        else if (p instanceof String s) { try { userId = java.util.UUID.fromString(s); } catch (Exception ignored) {} }
        if (userId == null) return ResponseEntity.status(401).build();
        if (!alertReads.existsByAlertIdAndUserId(id, userId)) {
            com.cityasist.domain.AlertRead ar = new com.cityasist.domain.AlertRead();
            ar.setAlertId(id);
            ar.setUserId(userId);
            alertReads.save(ar);
        }
        return ResponseEntity.noContent().build();
    }
}
