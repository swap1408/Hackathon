package com.cityasist.repo;

import com.cityasist.domain.SensorTimeseries;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface SensorTimeseriesRepository extends JpaRepository<SensorTimeseries, UUID> {
    List<SensorTimeseries> findBySensorIdAndTimeBetweenOrderByTimeAsc(UUID sensorId, Instant from, Instant to);
}
