package com.cityasist.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sensor_timeseries")
public class SensorTimeseries {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_id")
    private Sensor sensor;

    private Instant time;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String data;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Sensor getSensor() { return sensor; }
    public void setSensor(Sensor sensor) { this.sensor = sensor; }
    public Instant getTime() { return time; }
    public void setTime(Instant time) { this.time = time; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
