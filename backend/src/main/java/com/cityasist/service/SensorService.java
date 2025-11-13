package com.cityasist.service;

import com.cityasist.api.dto.SensorTimeseriesQuery;
import com.cityasist.domain.Sensor;
import com.cityasist.domain.SensorTimeseries;
import com.cityasist.repo.SensorRepository;
import com.cityasist.repo.SensorTimeseriesRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SensorService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SensorService.class);
    private final SensorRepository sensorRepository;
    private final SensorTimeseriesRepository timeseriesRepository;

    public SensorService(SensorRepository sensorRepository, SensorTimeseriesRepository timeseriesRepository) {
        this.sensorRepository = sensorRepository;
        this.timeseriesRepository = timeseriesRepository;
    }

    public List<Sensor> list() {
        var list = sensorRepository.findAll();
        if (list.isEmpty()) {
            // Provide deterministic demo sensors across India if none exist in DB
            java.util.List<Sensor> demo = new java.util.ArrayList<>();
            String[] types = new String[]{"aqi", "weather", "water-level", "aqi", "weather", "water-level", "aqi", "weather"};
            String[] zones = new String[]{"A", "B", "C", "D"};
            for (int i = 0; i < 8; i++) {
                Sensor s = new Sensor();
                s.setId(java.util.UUID.randomUUID());
                s.setType(types[i % types.length]);
                s.setLabel((s.getType().toUpperCase()) + " Sensor " + (i + 1));
                s.setZone(zones[i % zones.length]);
                double lat = 8 + (i * 7 % 29);   // 8..37
                double lon = 68 + (i * 9 % 29);  // 68..97
                s.setLat(lat + 0.12 * (i % 3));
                s.setLon(lon + 0.07 * (i % 4));
                s.setStatus(i % 5 == 0 ? "warning" : "online");
                s.setLastReportedAt(Instant.now().minusSeconds(60L * (i * 5)));
                demo.add(s);
            }
            log.info("Sensors listed count=0, returning demo count={}", demo.size());
            return demo;
        }
        log.info("Sensors listed count={}", list.size());
        return list;
    }

    public List<SensorTimeseries> timeseries(UUID sensorId, SensorTimeseriesQuery q) {
        Instant from = Instant.parse(q.getFrom());
        Instant to = Instant.parse(q.getTo());
        var series = timeseriesRepository.findBySensorIdAndTimeBetweenOrderByTimeAsc(sensorId, from, to);

        if (series.isEmpty()) {
            // Generate synthetic series when empty for demo visualization
            java.util.List<SensorTimeseries> demo = new java.util.ArrayList<>();
            long minutes = java.time.Duration.between(from, to).toMinutes();
            if (minutes <= 0) minutes = 60;

            for (int i = 0; i <= Math.min(minutes, 120); i += 5) {
                SensorTimeseries ts = new SensorTimeseries();
                ts.setTime(from.plusSeconds(i * 60L));

                double val = 20 + 5 * Math.sin(i / 10.0) + (sensorId.variant() % 3);

                // FIXED JSON STRING
                ts.setData(String.format("{\"value\": %.2f}", val));

                demo.add(ts);
            }

            log.info("Timeseries fetched sensorId={} from={} to={} count=0, returning demo count={}", 
                    sensorId, from, to, demo.size());
            return demo;
        }

        log.info("Timeseries fetched sensorId={} from={} to={} count={}", 
                sensorId, from, to, series.size());

        return series;
    }
}

