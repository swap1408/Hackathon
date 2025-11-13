package com.cityasist.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sensors")
public class Sensor {
    @Id
    @GeneratedValue
    private UUID id;

    private String type;
    private String label;
    private String zone;
    private Double lat;
    private Double lon;
    private String status;

    @Column(name = "last_reported_at")
    private Instant lastReportedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }
    public Double getLon() { return lon; }
    public void setLon(Double lon) { this.lon = lon; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getLastReportedAt() { return lastReportedAt; }
    public void setLastReportedAt(Instant lastReportedAt) { this.lastReportedAt = lastReportedAt; }
}
