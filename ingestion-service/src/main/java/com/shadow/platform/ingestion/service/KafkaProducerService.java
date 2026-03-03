package com.shadow.platform.ingestion.service;

import com.shadow.platform.ingestion.model.TrafficEvent;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class KafkaProducerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaProducerService.class);

    private final KafkaTemplate<String, TrafficEvent> kafkaTemplate;
    private final Counter prodEventsCounter;
    private final Counter shadowEventsCounter;
    private final Counter errorCounter;
    private final Timer publishTimer;

    @Value("${shadow.kafka.topics.prod-traffic}")
    private String prodTrafficTopic;

    @Value("${shadow.kafka.topics.shadow-traffic}")
    private String shadowTrafficTopic;

    public KafkaProducerService(KafkaTemplate<String, TrafficEvent> kafkaTemplate,
                                 MeterRegistry meterRegistry) {
        this.kafkaTemplate = kafkaTemplate;
        this.prodEventsCounter = Counter.builder("shadow.ingestion.events")
                .tag("type", "production")
                .description("Production traffic events ingested")
                .register(meterRegistry);
        this.shadowEventsCounter = Counter.builder("shadow.ingestion.events")
                .tag("type", "shadow")
                .description("Shadow traffic events ingested")
                .register(meterRegistry);
        this.errorCounter = Counter.builder("shadow.ingestion.errors")
                .description("Ingestion errors")
                .register(meterRegistry);
        this.publishTimer = Timer.builder("shadow.ingestion.publish.duration")
                .description("Time to publish event to Kafka")
                .register(meterRegistry);
    }

    @Async
    public CompletableFuture<Void> publishTrafficEvent(TrafficEvent event) {
        return publishTimer.record(() -> {
            String topic = resolveTopicForType(event.getTrafficType());
            String key = event.partitionKey();

            CompletableFuture<SendResult<String, TrafficEvent>> future =
                    kafkaTemplate.send(topic, key, event);

            return future.thenAccept(result -> {
                incrementCounter(event.getTrafficType());
                log.debug("Published {} event [request_id={}, topic={}, partition={}, offset={}]",
                        event.getTrafficType(),
                        event.getRequestId(),
                        result.getRecordMetadata().topic(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }).exceptionally(ex -> {
                errorCounter.increment();
                log.error("Failed to publish {} event [request_id={}]: {}",
                        event.getTrafficType(), event.getRequestId(), ex.getMessage(), ex);
                return null;
            });
        });
    }

    private String resolveTopicForType(String trafficType) {
        return "shadow".equalsIgnoreCase(trafficType) ? shadowTrafficTopic : prodTrafficTopic;
    }

    private void incrementCounter(String trafficType) {
        if ("shadow".equalsIgnoreCase(trafficType)) {
            shadowEventsCounter.increment();
        } else {
            prodEventsCounter.increment();
        }
    }
}
