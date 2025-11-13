package com.cityasist.repo;

import com.cityasist.domain.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AlertRepository extends JpaRepository<Alert, UUID> {
    Page<Alert> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query(value = """
        SELECT * FROM alerts a
        WHERE (:userId IS NULL OR NOT EXISTS (
            SELECT 1 FROM alert_reads ar WHERE ar.alert_id = a.id AND ar.user_id = :userId
        ))
        ORDER BY a.created_at DESC
    """, nativeQuery = true)
    Page<Alert> findVisibleForUser(@Param("userId") UUID userId, Pageable pageable);
}
