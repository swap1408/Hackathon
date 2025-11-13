package com.cityasist.api.dto;

import jakarta.validation.constraints.NotBlank;

public class TimelineCreateRequest {
    @NotBlank
    private String actor;
    @NotBlank
    private String text;

    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
