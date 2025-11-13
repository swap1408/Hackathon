package com.cityasist.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_timeline")
public class IncidentTimeline {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id")
    @JsonIgnore
    private Incident incident;

    private Instant time;
    private String actor;

    @Column(name = "text", columnDefinition = "text")
    private String text;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public Instant getTime() { return time; }
    public void setTime(Instant time) { this.time = time; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
