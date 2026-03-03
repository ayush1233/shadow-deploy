package com.shadow.platform.comparison;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ComparisonEngineApplication {

    public static void main(String[] args) {
        SpringApplication.run(ComparisonEngineApplication.class, args);
    }
}
