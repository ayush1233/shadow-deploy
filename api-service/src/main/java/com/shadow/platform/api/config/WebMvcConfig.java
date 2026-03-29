package com.shadow.platform.api.config;

import com.shadow.platform.api.interceptor.UsageMeteringInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final UsageMeteringInterceptor usageMeteringInterceptor;

    public WebMvcConfig(UsageMeteringInterceptor usageMeteringInterceptor) {
        this.usageMeteringInterceptor = usageMeteringInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(usageMeteringInterceptor)
                .addPathPatterns("/api/v1/**")
                .excludePathPatterns("/api/v1/auth/**", "/actuator/**", "/health");
    }
}
