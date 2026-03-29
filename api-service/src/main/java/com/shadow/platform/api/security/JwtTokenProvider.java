package com.shadow.platform.api.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;
import java.util.Map;

@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey key;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${shadow.jwt.secret}") String secret,
            @Value("${shadow.jwt.expiration-ms:86400000}") long expirationMs) {
        // SHA-256 always produces 32 bytes (256 bits), satisfying HMAC-SHA256 minimum
        byte[] keyBytes;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            keyBytes = digest.digest(secret.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            // Fallback: pad the secret to 32 bytes
            byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
            keyBytes = new byte[32];
            System.arraycopy(raw, 0, keyBytes, 0, Math.min(raw.length, 32));
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(String tenantId, String username, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(username)
                .claims(Map.of(
                        "tenant_id", tenantId,
                        "role", role))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return parseClaims(token).getPayload().getSubject();
    }

    public String getTenantIdFromToken(String token) {
        return parseClaims(token).getPayload().get("tenant_id", String.class);
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public String getRoleFromToken(String token) {
        return parseClaims(token).getPayload().get("role", String.class);
    }

    public String getRoleFromRequest(jakarta.servlet.http.HttpServletRequest request) {
        String role = (String) request.getAttribute("role");
        if (role != null) return role;
        String token = extractToken(request);
        return token != null ? getRoleFromToken(token) : null;
    }

    public String getUsernameFromRequest(jakarta.servlet.http.HttpServletRequest request) {
        String token = extractToken(request);
        return token != null ? getUsernameFromToken(token) : null;
    }

    private String extractToken(jakarta.servlet.http.HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private Jws<Claims> parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
    }
}
