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
            log.warn("AI Explanation is disabled or API key is missing. Using smart fallback for request_id={}", requestId);
            return CompletableFuture.completedFuture(buildSmartFallback(responseV1, responseV2, diffs));
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
                return CompletableFuture.completedFuture(buildSmartFallback(responseV1, responseV2, diffs));
            }
        } catch (Exception e) {
            log.warn("AI explanation failed for request_id={}: {}. Using smart fallback.", requestId, e.getMessage());
            return CompletableFuture.completedFuture(buildSmartFallback(responseV1, responseV2, diffs));
        }
    }

    /**
     * Generate a smart programmatic explanation from the field diffs
     * when the Gemini API is unavailable.
     */
    private AIExplanation buildSmartFallback(String responseV1, String responseV2, List<FieldDiff> diffs) {
        if (diffs == null || diffs.isEmpty()) {
            return new AIExplanation(
                    "Responses differ in content",
                    "The response bodies differ but no structured field-level differences were detected. "
                            + "This may indicate formatting changes, whitespace differences, or dynamic fields like timestamps.",
                    "Low — likely cosmetic or non-functional changes",
                    0.6);
        }

        int added = 0, removed = 0, modified = 0, typeChanged = 0;
        StringBuilder details = new StringBuilder();

        for (FieldDiff diff : diffs) {
            String type = diff.getDiffType() != null ? diff.getDiffType().toUpperCase() : "MODIFIED";
            switch (type) {
                case "ADDED" -> added++;
                case "REMOVED" -> removed++;
                case "TYPE_CHANGED" -> typeChanged++;
                default -> modified++;
            }
        }

        // Build summary
        StringBuilder summary = new StringBuilder();
        if (added > 0) summary.append(added).append(" field(s) added");
        if (removed > 0) {
            if (!summary.isEmpty()) summary.append(", ");
            summary.append(removed).append(" field(s) removed");
        }
        if (modified > 0) {
            if (!summary.isEmpty()) summary.append(", ");
            summary.append(modified).append(" field(s) modified");
        }
        if (typeChanged > 0) {
            if (!summary.isEmpty()) summary.append(", ");
            summary.append(typeChanged).append(" field(s) changed type");
        }
        summary.append(" between v1 and v2 responses.");

        // Build detailed analysis
        details.append("Field-level analysis:\n");
        int shown = 0;
        for (FieldDiff diff : diffs) {
            if (shown >= 8) {
                details.append(String.format("... and %d more differences.\n", diffs.size() - shown));
                break;
            }
            String path = diff.getPath() != null ? diff.getPath() : "unknown";
            String type = diff.getDiffType() != null ? diff.getDiffType() : "MODIFIED";
            String prodVal = diff.getProdValue() != null ? truncate(diff.getProdValue(), 60) : "null";
            String shadowVal = diff.getShadowValue() != null ? truncate(diff.getShadowValue(), 60) : "null";

            switch (type.toUpperCase()) {
                case "ADDED" -> details.append(String.format("• [ADDED] '%s' = %s (new in v2)\n", path, shadowVal));
                case "REMOVED" -> details.append(String.format("• [REMOVED] '%s' = %s (missing in v2)\n", path, prodVal));
                default -> details.append(String.format("• [%s] '%s': %s → %s\n", type, path, prodVal, shadowVal));
            }
            shown++;
        }

        // Determine impact
        String impact;
        double confidence;
        if (removed > 0 || typeChanged > 0) {
            impact = "Medium — removed or type-changed fields may break existing API consumers";
            confidence = 0.85;
        } else if (added > 0 && modified == 0) {
            impact = "Low — only additive changes detected, backward-compatible";
            confidence = 0.9;
        } else if (modified > 0 && removed == 0) {
            impact = "Medium — value changes detected, verify downstream consumers";
            confidence = 0.8;
        } else {
            impact = "High — multiple breaking changes including removed fields and type changes";
            confidence = 0.75;
        }

        return new AIExplanation(summary.toString(), details.toString(), impact, confidence);
    }

    private String truncate(String value, int maxLen) {
        if (value == null) return "null";
        return value.length() > maxLen ? value.substring(0, maxLen) + "..." : value;
    }

    private AIExplanation getFallbackExplanation() {
        return new AIExplanation(
                "Difference detected",
                "Difference detected but explanation unavailable.",
                "Unknown",
                0.0);
    }
}
