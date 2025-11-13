package com.cityasist.repo;

import com.cityasist.domain.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SensorRepository extends JpaRepository<Sensor, UUID> {}
