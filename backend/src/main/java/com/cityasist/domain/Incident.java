package com.cityasist.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.GenerationTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incidents")
public class Incident {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "incident_number", unique = true, updatable = false, insertable = false)
    @Generated(GenerationTime.INSERT)
    private Long incidentNumber;

    private String title;
    private String type;
    private String severity;
    private String status;

    private String location;

    @Column(name = "reported_at")
    private Instant reportedAt = Instant.now();

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Column(name = "reporter_id")
    private UUID reporterId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String data;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Long getIncidentNumber() { return incidentNumber; }
    public void setIncidentNumber(Long incidentNumber) { this.incidentNumber = incidentNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Instant getReportedAt() { return reportedAt; }
    public void setReportedAt(Instant reportedAt) { this.reportedAt = reportedAt; }
    public UUID getAssignedTo() { return assignedTo; }
    public void setAssignedTo(UUID assignedTo) { this.assignedTo = assignedTo; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
    public UUID getReporterId() { return reporterId; }
    public void setReporterId(UUID reporterId) { this.reporterId = reporterId; }
}
