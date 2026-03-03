package com.shadow.platform.ingestion.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Value("${shadow.kafka.topics.prod-traffic:prod-traffic}")
    private String prodTrafficTopic;

    @Value("${shadow.kafka.topics.shadow-traffic:shadow-traffic}")
    private String shadowTrafficTopic;

    @Bean
    public NewTopic prodTrafficTopic() {
        return TopicBuilder.name(prodTrafficTopic)
                .partitions(6)
                .replicas(1)
                .config("retention.ms", String.valueOf(7 * 24 * 60 * 60 * 1000L))
                .config("compression.type", "lz4")
                .build();
    }

    @Bean
    public NewTopic shadowTrafficTopic() {
        return TopicBuilder.name(shadowTrafficTopic)
                .partitions(6)
                .replicas(1)
                .config("retention.ms", String.valueOf(7 * 24 * 60 * 60 * 1000L))
                .config("compression.type", "lz4")
                .build();
    }
}
