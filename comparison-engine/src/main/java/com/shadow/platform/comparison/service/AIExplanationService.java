package com.shadow.platform.comparison.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadow.platform.comparison.model.ComparisonResult.AIExplanation;
import com.shadow.platform.comparison.model.ComparisonResult.FieldDiff;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class AIExplanationService {

    private static final Logger log = LoggerFactory.getLogger(AIExplanationService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String geminiApiKey;
    private final boolean enabled;

    public AIExplanationService(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${shadow.ai.explanation.gemini-api-key:${GEMINI_API_KEY:}}") String geminiApiKey,
            @Value("${shadow.ai.explanation.enabled:true}") boolean enabled) {
        this.webClient = webClientBuilder.baseUrl("https://generativelanguage.googleapis.com").build();
        this.objectMapper = objectMapper;
        this.geminiApiKey = geminiApiKey;
        this.enabled = enabled;
    }

    @Async
    public CompletableFuture<AIExplanation> generateExplanation(String requestId, String responseV1, String responseV2,
            List<FieldDiff> diffs) {
        if (!enabled || geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("AI Explanation is disabled or API key is missing. Skipping for request_id={}", requestId);
            return CompletableFuture.completedFuture(getFallbackExplanation());
        }

        log.info("AI explanation started [request_id={}]", requestId);

        try {
            String diffJson = objectMapper.writeValueAsString(diffs);

            String prompt = String.format(
                    """
                            You are an API regression analyzer.

                            Compare the following API responses and explain what changed and the potential risk.

                            Response V1:
                            %s

                            Response V2:
                            %s

                            JSON diff:
                            %s

                            Return structured explanation in JSON format with exactly the following keys:
                            "summary" (string), "details" (string), "impact" (string), "confidence" (number between 0 and 1).""",
                    responseV1 != null ? responseV1 : "null",
                    responseV2 != null ? responseV2 : "null",
                    diffJson != null ? diffJson : "[]");

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of("responseMimeType", "application/json"));

            JsonNode response = webClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-2.0-flash:generateContent")
                            .queryParam("key", geminiApiKey)
                            .build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response != null && response.has("candidates") && response.get("candidates").size() > 0) {
                String aiResponseText = response.get("candidates").get(0).get("content").get("parts").get(0).get("text")
                        .asText();
                AIExplanation explanation = objectMapper.readValue(aiResponseText, AIExplanation.class);
                log.info("AI explanation complete [request_id={}, confidence={}]", requestId,
                        explanation.getConfidence());
                return CompletableFuture.completedFuture(explanation);
            } else {
                log.error("Invalid response from Gemini API for request_id={}", requestId);
                return CompletableFuture.completedFuture(getFallbackExplanation());
            }
        } catch (Exception e) {
            log.error("AI explanation failed for request_id={}: {}", requestId, e.getMessage(), e);
            return CompletableFuture.completedFuture(getFallbackExplanation());
        }
    }

    private AIExplanation getFallbackExplanation() {
        return new AIExplanation(
                "Difference detected",
                "Difference detected but explanation unavailable.",
                "Unknown",
                0.0);
    }
}
