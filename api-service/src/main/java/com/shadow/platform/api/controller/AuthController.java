package com.shadow.platform.api.controller;

import com.shadow.platform.api.model.UserEntity;
import com.shadow.platform.api.repository.UserRepository;
import com.shadow.platform.api.security.JwtTokenProvider;
import com.shadow.platform.api.security.TenantAccess;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository,
                          JwtTokenProvider tokenProvider,
                          BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    // ─── Login ──────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username and password required"));
        }

        Optional<UserEntity> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        UserEntity user = userOpt.get();

        if (!user.getIsActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Account is disabled"));
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        String token = tokenProvider.generateToken(
                user.getTenantId(), user.getUsername(), user.getRole());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", user.getUsername(),
                "tenant_id", user.getTenantId(),
                "role", user.getRole(),
                "expires_in", 86400));
    }

    // ─── Signup (admin only) ────────────────────────────────────
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body,
                                     HttpServletRequest request) {
        // Allow unauthenticated signup only if no users exist (bootstrap)
        long userCount = userRepository.count();
        boolean isBootstrap = userCount == 0;

        if (!isBootstrap) {
            // Require admin role from JWT
            String role = tokenProvider.getRoleFromRequest(request);
            if (!"admin".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only admins can create users"));
            }
        }

        String username = body.get("username");
        String password = body.get("password");
        String email = body.get("email");
        String role = body.getOrDefault("role", "viewer");
        String tenantId = body.getOrDefault("tenant_id",
                isBootstrap ? "default" : TenantAccess.requireTenantId(request));

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username and password are required"));
        }

        if (password.length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password must be at least 8 characters"));
        }

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Username already exists"));
        }

        if (email != null && !email.isBlank() && userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already in use"));
        }

        UserEntity user = UserEntity.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(isBootstrap ? "admin" : role)
                .tenantId(tenantId)
                .isActive(true)
                .build();

        userRepository.save(user);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("tenant_id", user.getTenantId());
        response.put("message", "User created successfully");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─── List users (admin, scoped to tenant) ───────────────────
    @GetMapping("/users")
    public ResponseEntity<?> listUsers(HttpServletRequest request) {
        String role = tokenProvider.getRoleFromRequest(request);
        if (!"admin".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only admins can list users"));
        }

        String tenantId = TenantAccess.requireTenantId(request);

        List<Map<String, Object>> users = userRepository.findByTenantId(tenantId).stream()
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("email", u.getEmail());
                    m.put("role", u.getRole());
                    m.put("is_active", u.getIsActive());
                    m.put("created_at", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("users", users, "tenant_id", tenantId));
    }
}
