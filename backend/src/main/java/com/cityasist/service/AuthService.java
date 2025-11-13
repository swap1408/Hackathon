package com.cityasist.service;

import com.cityasist.api.dto.LoginRequest;
import com.cityasist.api.dto.LoginResponse;
import com.cityasist.api.dto.RefreshRequest;
import com.cityasist.api.dto.RegisterRequest;
import com.cityasist.domain.RefreshToken;
import com.cityasist.domain.Role;
import com.cityasist.domain.User;
import com.cityasist.repo.RefreshTokenRepository;
import com.cityasist.repo.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final long refreshTtlDays;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       @Value("${app.jwt.refreshTokenTtlDays}") long refreshTtlDays) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTtlDays = refreshTtlDays;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed for email={}", request.getEmail());
            throw new RuntimeException("Invalid credentials");
        }
        String access = jwtService.generateAccessToken(user.getId(), user.getRole());
        RefreshToken rt = issueRefreshToken(user.getId());
        log.info("User logged in userId={} role={}", user.getId(), user.getRole());

        LoginResponse resp = new LoginResponse();
        resp.setAccessToken(access);
        resp.setRefreshToken(rt.getToken());
        LoginResponse.UserInfo ui = new LoginResponse.UserInfo();
        ui.setId(user.getId().toString());
        ui.setName(user.getName());
        ui.setEmail(user.getEmail());
        ui.setRole(user.getRole());
        resp.setUser(ui);
        return resp;
    }

    @Transactional
    public String refresh(RefreshRequest request) {
        RefreshToken rt = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));
        if (rt.isRevoked() || rt.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Refresh token expired or revoked");
        }
        // rotate refresh token
        refreshTokenRepository.deleteByUserId(rt.getUserId());
        RefreshToken newRt = issueRefreshToken(rt.getUserId());
        log.info("Refresh token rotated for userId={}", rt.getUserId());
        // return new access token
        Role role = userRepository.findById(rt.getUserId()).map(User::getRole).orElse(Role.CITIZEN);
        return jwtService.generateAccessToken(rt.getUserId(), role);
    }

    private RefreshToken issueRefreshToken(UUID userId) {
        RefreshToken token = new RefreshToken();
        token.setUserId(userId);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiresAt(Instant.now().plus(refreshTtlDays, ChronoUnit.DAYS));
        token.setRevoked(false);
        return refreshTokenRepository.save(token);
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(u -> {
            throw new RuntimeException("Email already in use");
        });
        User u = new User();
        u.setName(request.getName());
        u.setEmail(request.getEmail());
        u.setRole(Role.CITIZEN);
        u.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        User saved = userRepository.save(u);
        String access = jwtService.generateAccessToken(saved.getId(), saved.getRole());
        RefreshToken rt = issueRefreshToken(saved.getId());

        LoginResponse resp = new LoginResponse();
        resp.setAccessToken(access);
        resp.setRefreshToken(rt.getToken());
        LoginResponse.UserInfo ui = new LoginResponse.UserInfo();
        ui.setId(saved.getId().toString());
        ui.setName(saved.getName());
        ui.setEmail(saved.getEmail());
        ui.setRole(saved.getRole());
        resp.setUser(ui);
        return resp;
    }
}
