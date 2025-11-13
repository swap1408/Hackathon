package com.cityasist.api;

import com.cityasist.service.AiGatewayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {
    private final AiGatewayService aiGatewayService;
    public AiController(AiGatewayService aiGatewayService) { this.aiGatewayService = aiGatewayService; }

    @PostMapping("/predict/flood")
    public ResponseEntity<Map<String, Object>> predictFlood(@RequestParam(required = false) String model,
                                                            @RequestBody Map<String, Object> features) {
        if (model != null && !model.isBlank()) {
            features.put("_model", model);
        }
        return ResponseEntity.ok(aiGatewayService.predictFlood(features));
    }

    @PostMapping("/predict/aqi")
    public ResponseEntity<Map<String, Object>> predictAqi(@RequestBody Map<String, Object> features) {
        return ResponseEntity.ok(aiGatewayService.predictAqi(features));
    }

    @GetMapping("/models")
    public ResponseEntity<List<Map<String, Object>>> models() {
        return ResponseEntity.ok(aiGatewayService.listModels());
    }
}
