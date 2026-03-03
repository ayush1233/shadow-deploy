"""
Risk Scorer — Computes deployment risk score (0-10)
and classifies severity based on comparison results.
"""

import logging

logger = logging.getLogger("ai-service.risk_scorer")


class RiskScorer:
    """
    Calculates a deployment risk score (0-10) based on:
    - Semantic similarity score
    - Status code mismatches
    - Latency regression
    - Number/type of field differences
    - Structural changes
    """

    # Severity thresholds
    THRESHOLDS = {
        "critical": 8.0,
        "high": 6.0,
        "medium": 3.0,
        "low": 1.0,
    }

    def calculate(
        self,
        similarity_score: float = 1.0,
        has_status_mismatch: bool = False,
        latency_delta_ms: int = 0,
        field_diff_count: int = 0,
        has_structural_changes: bool = False,
    ) -> float:
        """
        Compute risk score (0-10).

        Weights:
        - Similarity inverse:           35%
        - Status mismatch:              25%
        - Field diff impact:            20%
        - Structural changes:           10%
        - Latency regression:           10%
        """
        risk = 0.0

        # 1. Similarity inverse (35% weight, max 3.5)
        similarity_risk = (1.0 - similarity_score) * 10.0
        risk += similarity_risk * 0.35

        # 2. Status code mismatch (25% weight, max 2.5)
        if has_status_mismatch:
            risk += 10.0 * 0.25

        # 3. Field diff impact (20% weight, max 2.0)
        diff_risk = min(field_diff_count * 1.5, 10.0)
        risk += diff_risk * 0.20

        # 4. Structural changes (10% weight, max 1.0)
        if has_structural_changes:
            risk += 5.0 * 0.10

        # 5. Latency regression (10% weight, max 1.0)
        if latency_delta_ms > 0:
            latency_risk = min(latency_delta_ms / 500.0 * 10.0, 10.0)
            risk += latency_risk * 0.10

        final_risk = round(min(max(risk, 0.0), 10.0), 1)

        logger.debug(
            f"Risk calculation: similarity={similarity_score:.2f}, "
            f"status_mismatch={has_status_mismatch}, "
            f"latency_delta={latency_delta_ms}ms, "
            f"field_diffs={field_diff_count}, "
            f"structural={has_structural_changes} → risk={final_risk}"
        )

        return final_risk

    def classify_severity(self, risk_score: float) -> str:
        """Classify risk score into severity level."""
        if risk_score >= self.THRESHOLDS["critical"]:
            return "critical"
        elif risk_score >= self.THRESHOLDS["high"]:
            return "high"
        elif risk_score >= self.THRESHOLDS["medium"]:
            return "medium"
        elif risk_score >= self.THRESHOLDS["low"]:
            return "low"
        else:
            return "none"

    def recommend_action(self, risk_score: float, severity: str) -> str:
        """Generate recommended action based on risk score and severity."""
        actions = {
            "none": "SAFE_TO_PROMOTE",
            "low": "SAFE_TO_PROMOTE",
            "medium": "REVIEW_RECOMMENDED",
            "high": "MANUAL_REVIEW_REQUIRED",
            "critical": "BLOCK_DEPLOYMENT",
        }
        return actions.get(severity, "REVIEW_RECOMMENDED")
