package com.cityasist.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiGatewayService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AiGatewayService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private final String aiBaseUrl;

    public AiGatewayService(@Value("${app.ai.baseUrl:http://localhost:8000}") String aiBaseUrl) {
        this.aiBaseUrl = aiBaseUrl;
    }

    public Map<String, Object> predictFlood(Map<String, Object> features) {
        // If a specific local model is requested, use it directly
        String sel = getString(features, "_model");
        if (sel != null && !sel.isBlank()) {
            String modelName = sel.split(":" ,2)[0].trim().toLowerCase();
            switch (modelName) {
                case "flood-heuristic":
                    return heuristicFloodPrediction(features);
                case "flood-logistic":
                    return heuristicFloodPredictionLogistic(features);
                default:
                    // unknown local model; try remote below
                    break;
            }
        }
        // Try external service first
        try {
            log.info("Calling AI predict flood at {}", aiBaseUrl);
            ResponseEntity<Map> resp = restTemplate.postForEntity(aiBaseUrl + "/predict/flood", features, Map.class);
            Map body = resp.getBody();
            if (body != null && !body.isEmpty()) {
                return body;
            }
            log.warn("AI service returned empty response, falling back to heuristic");
        } catch (RestClientException e) {
            log.warn("AI service unavailable, using heuristic prediction: {}", e.getMessage());
        }
        // Fallback: heuristic prediction based on provided features
        return heuristicFloodPrediction(features);
    }

    public List<Map<String, Object>> listModels() {
        List<Map<String, Object>> models = new ArrayList<>();
        // Always include local models
        models.add(Map.of("name", "flood-heuristic", "version", "1.0.0"));
        models.add(Map.of("name", "flood-logistic", "version", "1.0.0"));
        try {
            log.info("Fetching AI models at {}", aiBaseUrl);
            ResponseEntity<List> resp = restTemplate.getForEntity(aiBaseUrl + "/models", List.class);
            List remote = resp.getBody();
            if (remote != null) {
                //noinspection unchecked
                models.addAll(remote);
            }
        } catch (RestClientException e) {
            log.warn("AI service unavailable, only heuristic model listed: {}", e.getMessage());
        }
        return models;
    }

    public Map<String, Object> predictAqi(Map<String, Object> features) {
        // Heuristic AQI prediction using PM2.5 / PM10 (ug/m3) -> category and score [0,1]
        double pm25 = getDouble(features, "pm25");
        double pm10 = getDouble(features, "pm10");
        double base = 0.0;
        if (!Double.isNaN(pm25)) base = Math.max(base, pm25 / 150.0); // 150 ~ very unhealthy
        if (!Double.isNaN(pm10)) base = Math.max(base, pm10 / 300.0);
        base = clamp01(base);
        String label;
        if (base < 0.2) label = "GOOD";
        else if (base < 0.4) label = "MODERATE";
        else if (base < 0.6) label = "UNHEALTHY_SENSITIVE";
        else if (base < 0.8) label = "UNHEALTHY";
        else label = "VERY_UNHEALTHY";
        java.util.Map<String, Object> out = new java.util.HashMap<>();
        out.put("probability", base);
        out.put("label", label);
        out.put("model", "aqi-heuristic");
        out.put("version", "1.0.0");
        return out;
    }

    private Map<String, Object> heuristicFloodPrediction(Map<String, Object> features) {
        double rainfall = getDouble(features, "rainfall_mm");            // e.g., 0..200+
        double riverLevel = getDouble(features, "river_level_m");        // e.g., 0..10+
        double soil = getDouble(features, "soil_moisture_percent");      // e.g., 0..100
        String zone = getString(features, "zone");

        int provided = 0;
        if (!Double.isNaN(rainfall)) provided++;
        if (!Double.isNaN(riverLevel)) provided++;
        if (!Double.isNaN(soil)) provided++;

        // Normalize and weight
        double rainComp = clamp01(rainfall / 200.0);     // 200mm ~ extreme
        double riverComp = clamp01(riverLevel / 8.0);    // 8m ~ high
        double soilComp = clamp01(soil / 100.0);         // 100% saturated

        double weightRain = 0.4, weightRiver = 0.45, weightSoil = 0.15;
        double prob = 0.0;
        if (provided > 0) {
            prob = weightRain * (Double.isNaN(rainComp) ? 0 : rainComp)
                 + weightRiver * (Double.isNaN(riverComp) ? 0 : riverComp)
                 + weightSoil * (Double.isNaN(soilComp) ? 0 : soilComp);
            // Zone adjustment
            if (zone != null && !zone.isBlank()) {
                String z = zone.toLowerCase();
                if (z.contains("lowland") || z.contains("river") || z.contains("coast") || z.matches(".*zone\s*[ab].*")) {
                    prob = clamp01(prob + 0.1);
                }
            }
        } else {
            // No numeric features provided
            prob = Double.NaN;
        }

        String label;
        if (Double.isNaN(prob)) label = "UNKNOWN";
        else if (prob >= 0.8) label = "CRITICAL";
        else if (prob >= 0.6) label = "HIGH";
        else if (prob >= 0.4) label = "MEDIUM";
        else if (prob >= 0.2) label = "LOW";
        else label = "VERY_LOW";

        double confidence = provided / 3.0; // simple proxy: more features => higher confidence

        Map<String, Object> out = new HashMap<>();
        if (!Double.isNaN(prob)) out.put("probability", prob);
        out.put("label", label);
        out.put("confidence", confidence);
        out.put("model", "flood-heuristic");
        out.put("version", "1.0.0");
        return out;
    }

    private Map<String, Object> heuristicFloodPredictionLogistic(Map<String, Object> features) {
        double rainfall = getDouble(features, "rainfall_mm");
        double riverLevel = getDouble(features, "river_level_m");
        double soil = getDouble(features, "soil_moisture_percent");
        String zone = getString(features, "zone");

        double rainComp = clamp01(rainfall / 150.0);
        double riverComp = clamp01(riverLevel / 6.0);
        double soilComp = clamp01(soil / 100.0);

        double zoneBoost = 0.0;
        if (zone != null) {
            String z = zone.toLowerCase();
            if (z.contains("lowland") || z.contains("river") || z.contains("coast") || z.matches(".*zone\s*[ab].*")) {
                zoneBoost = 0.5;
            }
        }
        // logistic model
        double z = 1.2 * rainComp + 1.6 * riverComp + 0.6 * soilComp + zoneBoost - 1.5;
        double prob = 1.0 / (1.0 + Math.exp(-z));
        prob = clamp01(prob);

        String label;
        if (prob >= 0.8) label = "CRITICAL";
        else if (prob >= 0.6) label = "HIGH";
        else if (prob >= 0.4) label = "MEDIUM";
        else if (prob >= 0.2) label = "LOW";
        else label = "VERY_LOW";

        Map<String, Object> out = new HashMap<>();
        out.put("probability", prob);
        out.put("label", label);
        out.put("confidence", 0.7); // static proxy for demo
        out.put("model", "flood-logistic");
        out.put("version", "1.0.0");
        return out;
    }

    private static double getDouble(Map<String, Object> m, String key) {
        Object v = m != null ? m.get(key) : null;
        if (v == null) return Double.NaN;
        if (v instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(String.valueOf(v)); } catch (Exception ignored) {}
        return Double.NaN;
    }

    private static String getString(Map<String, Object> m, String key) {
        Object v = m != null ? m.get(key) : null;
        return v == null ? null : String.valueOf(v);
    }

    private static double clamp01(double x) {
        return Math.max(0.0, Math.min(1.0, x));
    }
}
