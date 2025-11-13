package com.cityasist.api.dto;

import jakarta.validation.constraints.NotBlank;

public class IncidentSeverityUpdateRequest {
    @NotBlank
    private String severity;
    private String text; // optional timeline note

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}