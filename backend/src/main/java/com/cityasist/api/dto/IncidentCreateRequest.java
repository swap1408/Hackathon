package com.cityasist.api.dto;

import jakarta.validation.constraints.NotBlank;

public class IncidentCreateRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String type;
    @NotBlank
    private String severity;
    @NotBlank
    private String status;
    private String location;
    private String data; // JSON string

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
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
