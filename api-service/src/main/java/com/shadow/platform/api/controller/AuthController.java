package com.shadow.platform.api.controller;

import com.shadow.platform.api.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtTokenProvider tokenProvider;

    // Demo credentials - replace with real user store in production
    private static final Map<String, Map<String, String>> USERS = Map.of(
            "admin", Map.of("password", "shadow-admin", "role", "admin", "tenant", "default"),
            "demo", Map.of("password", "demo-pass", "role", "viewer", "tenant", "demo"));

    public AuthController(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username and password required"));
        }

        Map<String, String> user = USERS.get(username);
        if (user == null || !user.get("password").equals(password)) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid credentials"));
        }

        String token = tokenProvider.generateToken(
                user.get("tenant"), username, user.get("role"));

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", username,
                "tenant_id", user.get("tenant"),
                "role", user.get("role"),
                "expires_in", 86400));
    }
}
