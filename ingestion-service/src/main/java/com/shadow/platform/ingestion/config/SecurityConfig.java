package com.shadow.platform.ingestion.config;

import com.shadow.platform.ingestion.filter.ApiKeyAuthFilter;
import com.shadow.platform.ingestion.filter.TenantFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final ApiKeyAuthFilter apiKeyAuthFilter;
    private final TenantFilter tenantFilter;

    public SecurityConfig(ApiKeyAuthFilter apiKeyAuthFilter, TenantFilter tenantFilter) {
        this.apiKeyAuthFilter = apiKeyAuthFilter;
        this.tenantFilter = tenantFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/health").permitAll()
                // Public health endpoint used by k8s/docker-compose health checks
                .requestMatchers("/api/v1/ingest/health").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(apiKeyAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(tenantFilter, ApiKeyAuthFilter.class);

        return http.build();
    }
}
