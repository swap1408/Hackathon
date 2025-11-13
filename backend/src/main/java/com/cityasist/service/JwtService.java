package com.cityasist.service;

import com.cityasist.domain.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    private final SecretKey key;
    private final long accessTtlMinutes;

    public record JwtPrincipal(UUID userId, Role role) {}

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.accessTokenTtlMinutes}") long accessTtlMinutes
    ) {
        // Derive a strong 256-bit key from the provided secret to avoid WeakKeyException on short secrets
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = md.digest(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            this.key = Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize JWT key", e);
        }
        this.accessTtlMinutes = accessTtlMinutes;
    }

    public String generateAccessToken(UUID userId, Role role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(userId.toString())
                .claim("role", role.name())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(accessTtlMinutes, ChronoUnit.MINUTES)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public JwtPrincipal parseToken(String token) {
        try {
            Jws<Claims> jws = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            UUID userId = UUID.fromString(jws.getBody().getSubject());
            Role role = Role.valueOf(jws.getBody().get("role", String.class));
            return new JwtPrincipal(userId, role);
        } catch (Exception e) {
            return null;
        }
    }
}
