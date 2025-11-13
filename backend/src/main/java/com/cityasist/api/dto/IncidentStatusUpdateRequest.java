package com.cityasist.api.dto;

import jakarta.validation.constraints.NotBlank;

public class IncidentStatusUpdateRequest {
    @NotBlank
    private String status;
    private String text; // optional timeline note

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
