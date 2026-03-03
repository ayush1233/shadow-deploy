package com.shadow.platform.comparison.service;

import com.shadow.platform.comparison.model.ComparisonResult;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Calculates deployment risk score based on aggregated comparison results.
 * Risk = weighted average of:
 * - Mismatch rate (40%)
 * - Critical mismatch ratio (30%)
 * - Average latency regression (15%)
 * - Structure mismatch rate (15%)
 */
@Service
public class RiskScoreCalculator {

    private static final Logger log = LoggerFactory.getLogger(RiskScoreCalculator.class);

    private final ConcurrentHashMap<String, DeploymentStats> deploymentStatsMap = new ConcurrentHashMap<>();
    private final AtomicReference<Double> currentRiskScore = new AtomicReference<>(0.0);

    public RiskScoreCalculator(MeterRegistry meterRegistry) {
        Gauge.builder("shadow.deployment.risk_score", currentRiskScore, AtomicReference::get)
                .description("Current deployment risk score (0-10)")
                .register(meterRegistry);
    }

    public double updateAndGetRiskScore(String deploymentId, ComparisonResult result) {
        if (deploymentId == null)
            deploymentId = "default";

        DeploymentStats stats = deploymentStatsMap.computeIfAbsent(deploymentId, k -> new DeploymentStats());
        stats.totalRequests.incrementAndGet();

        if (!result.isDeterministicPass()) {
            stats.mismatches.incrementAndGet();
        }

        if ("critical".equalsIgnoreCase(result.getSeverity())) {
            stats.criticalMismatches.incrementAndGet();
        } else if ("high".equalsIgnoreCase(result.getSeverity())) {
            stats.highMismatches.incrementAndGet();
        }

        if (!result.isStructureMatch()) {
            stats.structureMismatches.incrementAndGet();
        }

        if (result.getLatencyDeltaMs() != null && result.getLatencyDeltaMs() > 0) {
            stats.latencyRegressions.incrementAndGet();
            stats.totalLatencyDelta.addAndGet(result.getLatencyDeltaMs());
        }

        double riskScore = calculateScore(stats);
        currentRiskScore.set(riskScore);

        return riskScore;
    }

    private double calculateScore(DeploymentStats stats) {
        int total = stats.totalRequests.get();
        if (total == 0)
            return 0.0;

        double mismatchRate = (double) stats.mismatches.get() / total;
        double criticalRatio = (double) (stats.criticalMismatches.get() + stats.highMismatches.get())
                / Math.max(1, stats.mismatches.get());
        double structureRate = (double) stats.structureMismatches.get() / total;
        double avgLatencyDelta = stats.latencyRegressions.get() > 0
                ? (double) stats.totalLatencyDelta.get() / stats.latencyRegressions.get() / 1000.0
                : 0.0;

        // Normalize to 0-10 scale
        double score = 0.0;
        score += Math.min(mismatchRate * 10, 10) * 0.40; // 40% weight
        score += Math.min(criticalRatio * 10, 10) * 0.30; // 30% weight
        score += Math.min(avgLatencyDelta * 2, 10) * 0.15; // 15% weight
        score += Math.min(structureRate * 10, 10) * 0.15; // 15% weight

        return Math.round(score * 100.0) / 100.0;
    }

    public DeploymentStats getStats(String deploymentId) {
        return deploymentStatsMap.getOrDefault(deploymentId, new DeploymentStats());
    }

    public void resetDeployment(String deploymentId) {
        deploymentStatsMap.remove(deploymentId);
    }

    public static class DeploymentStats {
        public final AtomicInteger totalRequests = new AtomicInteger(0);
        public final AtomicInteger mismatches = new AtomicInteger(0);
        public final AtomicInteger criticalMismatches = new AtomicInteger(0);
        public final AtomicInteger highMismatches = new AtomicInteger(0);
        public final AtomicInteger structureMismatches = new AtomicInteger(0);
        public final AtomicInteger latencyRegressions = new AtomicInteger(0);
        public final java.util.concurrent.atomic.AtomicLong totalLatencyDelta = new java.util.concurrent.atomic.AtomicLong(
                0);
    }
}
