package com.cityasist.repo;

import com.cityasist.domain.AlertRead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AlertReadRepository extends JpaRepository<AlertRead, UUID> {
    boolean existsByAlertIdAndUserId(UUID alertId, UUID userId);
}