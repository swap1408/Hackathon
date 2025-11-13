package com.cityasist.api;

import com.cityasist.api.dto.LoginRequest;
import com.cityasist.api.dto.LoginResponse;
import com.cityasist.api.dto.RefreshRequest;
import com.cityasist.api.dto.RegisterRequest;
import com.cityasist.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshRequest req) {
        String newAccess = authService.refresh(req);
        return ResponseEntity.ok(java.util.Map.of("access_token", newAccess));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }
}
