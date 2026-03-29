package com.shadow.platform.api.config;

import com.shadow.platform.api.model.UserEntity;
import com.shadow.platform.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a default admin user on startup if no users exist in the database,
 * OR if the existing admin user's password hash is stale/incorrect.
 *
 * Default credentials:
 *   username: admin
 *   password: shadow-admin
 */
@Component
@Order(1)
public class DefaultAdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultAdminSeeder.class);

    private static final String DEFAULT_USERNAME = "admin";
    private static final String DEFAULT_PASSWORD = "shadow-admin";
    private static final String DEFAULT_EMAIL = "admin@shadow-deploy.local";
    private static final String DEFAULT_TENANT = "default";

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public DefaultAdminSeeder(UserRepository userRepository,
                              BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        var existing = userRepository.findByUsername(DEFAULT_USERNAME);

        if (existing.isEmpty()) {
            // No admin user at all — create one
            log.info("No '{}' user found. Seeding default admin user...", DEFAULT_USERNAME);
            createDefaultAdmin();
            return;
        }

        // Admin exists — verify the password hash is correct
        UserEntity admin = existing.get();
        if (!passwordEncoder.matches(DEFAULT_PASSWORD, admin.getPasswordHash())) {
            log.warn("Default admin password hash is invalid. Resetting to default password...");
            admin.setPasswordHash(passwordEncoder.encode(DEFAULT_PASSWORD));
            userRepository.save(admin);
            log.info("Default admin password has been reset successfully.");
        } else {
            log.info("Default admin user verified OK.");
        }
    }

    private void createDefaultAdmin() {
        UserEntity admin = UserEntity.builder()
                .username(DEFAULT_USERNAME)
                .email(DEFAULT_EMAIL)
                .passwordHash(passwordEncoder.encode(DEFAULT_PASSWORD))
                .role("admin")
                .tenantId(DEFAULT_TENANT)
                .isActive(true)
                .build();

        userRepository.save(admin);
        log.info("Default admin user created: username='{}', password='{}'",
                DEFAULT_USERNAME, DEFAULT_PASSWORD);
    }
}
