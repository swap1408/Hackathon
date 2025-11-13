package com.cityasist.repo;

import com.cityasist.domain.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    List<Incident> findByStatusAndSeverity(String status, String severity);
    List<Incident> findByReportedAtBetween(Instant from, Instant to);
    Page<Incident> findByReporterId(UUID reporterId, Pageable pageable);
    Page<Incident> findByAssignedTo(UUID assignedTo, Pageable pageable);
    java.util.Optional<Incident> findByIncidentNumber(Long incidentNumber);

    @Query("""
        select i from Incident i
        where (i.reporterId = coalesce(:reporterId, i.reporterId))
          and (i.status = coalesce(:status, i.status))
          and (i.severity = coalesce(:severity, i.severity))
          and (i.reportedAt >= coalesce(:fromTs, i.reportedAt))
          and (i.reportedAt <= coalesce(:toTs, i.reportedAt))
          and (i.location is null or i.location like :zonePattern)
        order by i.reportedAt desc
    """)
    Page<Incident> search(
            @Param("reporterId") UUID reporterId,
            @Param("status") String status,
            @Param("severity") String severity,
            @Param("fromTs") Instant from,
            @Param("toTs") Instant to,
            @Param("zonePattern") String zonePattern,
            Pageable pageable
    );
}
