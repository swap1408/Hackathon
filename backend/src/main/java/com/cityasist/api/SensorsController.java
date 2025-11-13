package com.cityasist.api;

import com.cityasist.api.dto.SensorTimeseriesQuery;
import com.cityasist.domain.Sensor;
import com.cityasist.domain.SensorTimeseries;
import com.cityasist.service.SensorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sensors")
public class SensorsController {
    private final SensorService sensorService;
    public SensorsController(SensorService sensorService) { this.sensorService = sensorService; }

    @GetMapping
    public List<Sensor> list() {
        return sensorService.list();
    }

    @GetMapping("/{id}/timeseries")
    public ResponseEntity<List<SensorTimeseries>> timeseries(@PathVariable UUID id,
                                                             @Valid SensorTimeseriesQuery q) {
        return ResponseEntity.ok(sensorService.timeseries(id, q));
    }
}
