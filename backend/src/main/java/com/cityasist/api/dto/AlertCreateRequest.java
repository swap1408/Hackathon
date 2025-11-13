package com.cityasist.api.dto;

import jakarta.validation.constraints.NotBlank;

public class AlertCreateRequest {
    @NotBlank
    private String type; // flood, aqi, etc
    @NotBlank
    private String title;
    @NotBlank
    private String message;
    @NotBlank
    private String severity; // info, warning, critical
    private String zone;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
}
