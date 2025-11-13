package com.cityasist.repo;

import com.cityasist.domain.IncidentTimeline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IncidentTimelineRepository extends JpaRepository<IncidentTimeline, UUID> {
    List<IncidentTimeline> findByIncidentIdOrderByTimeAsc(UUID incidentId);
}
