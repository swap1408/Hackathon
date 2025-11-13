package com.cityasist.api.dto;

import jakarta.validation.constraints.NotBlank;

public class SensorTimeseriesQuery {
    @NotBlank
    private String from; // ISO-8601
    @NotBlank
    private String to;   // ISO-8601
    private String interval; // optional bucket size

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public String getInterval() { return interval; }
    public void setInterval(String interval) { this.interval = interval; }
}
