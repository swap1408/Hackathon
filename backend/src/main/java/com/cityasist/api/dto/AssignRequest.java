package com.cityasist.api.dto;

import jakarta.validation.constraints.NotBlank;

public class AssignRequest {
    @NotBlank
    private String assignedTo; // UUID as string

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
}
