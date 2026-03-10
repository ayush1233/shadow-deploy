"""
Semantic Comparator — LLM-powered API response comparison.

Supports pluggable backends (Gemini, Ollama, heuristic fallback)
via the LLMProvider abstraction.
"""

import json
import logging
from typing import Dict, Any, List, Optional

from comparison.llm_provider import LLMProvider

logger = logging.getLogger("ai-service.semantic_comparator")


class SemanticComparator:
    """
    Uses an LLM provider to perform semantic comparison of API responses.
    Falls back to heuristic analysis when no provider is available.
    """

    def __init__(self, provider: Optional[LLMProvider] = None, api_key: str = ""):
        """
        Args:
            provider: Pre-built LLMProvider instance (preferred).
            api_key:  Legacy — if provider is None and api_key is given,
                      builds a GeminiProvider automatically.
        """
        if provider is not None:
            self.provider = provider
        elif api_key:
            from comparison.llm_provider import GeminiProvider
            self.provider = GeminiProvider(api_key=api_key)
        else:
            self.provider = None

        if self.provider and self.provider.is_configured():
            logger.info(f"SemanticComparator using {type(self.provider).__name__}")
        else:
            logger.warning("No LLM provider — using fallback heuristic comparison")
            self.provider = None

    def is_configured(self) -> bool:
        return self.provider is not None and self.provider.is_configured()

    async def compare(
        self,
        prod_body: str,
        shadow_body: str,
        endpoint: str,
        field_diffs: Optional[List] = None,
        status_match: bool = True,
        latency_delta_ms: int = 0,
    ) -> Dict[str, Any]:
        if self.provider:
            return await self._llm_compare(
                prod_body, shadow_body, endpoint,
                field_diffs, status_match, latency_delta_ms
            )
        return self._heuristic_compare(
            prod_body, shadow_body, endpoint,
            field_diffs, status_match, latency_delta_ms
        )

    async def _llm_compare(
        self,
        prod_body: str,
        shadow_body: str,
        endpoint: str,
        field_diffs: Optional[List],
        status_match: bool,
        latency_delta_ms: int,
    ) -> Dict[str, Any]:
        prompt = self._build_prompt(
            prod_body, shadow_body, endpoint,
            field_diffs, status_match, latency_delta_ms
        )

        try:
            result = await self.provider.generate_json(prompt)
            return {
                "similarity_score": float(result.get("similarity_score", 0.5)),
                "explanation": result.get("explanation", "No explanation generated"),
                "has_structural_changes": result.get("has_structural_changes", False),
                "breaking_changes": result.get("breaking_changes", []),
                "safe_differences": result.get("safe_differences", []),
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
        except Exception as e:
            logger.error(f"LLM comparison failed: {e}")

        # Fallback on any error
        return self._heuristic_compare(
            prod_body, shadow_body, endpoint,
            field_diffs, status_match, latency_delta_ms
        )

    # ── Prompt ──────────────────────────────────────

    def _build_prompt(
        self,
        prod_body: str,
        shadow_body: str,
        endpoint: str,
        field_diffs: Optional[List],
        status_match: bool,
        latency_delta_ms: int,
    ) -> str:
        diff_summary = "No field-level diffs available."
        if field_diffs:
            diff_lines = []
            for d in field_diffs[:20]:
                if hasattr(d, 'dict'):
                    d = d.dict()
                elif hasattr(d, 'model_dump'):
                    d = d.model_dump()
                diff_lines.append(
                    f"  - {d.get('diff_type', 'UNKNOWN')} at "
                    f"'{d.get('path', '?')}': "
                    f"prod={d.get('prod_value', 'N/A')!r} → "
                    f"shadow={d.get('shadow_value', 'N/A')!r}"
                )
            diff_summary = "\n".join(diff_lines)

        max_body_len = 3000
        prod_truncated = prod_body[:max_body_len] if prod_body else "(empty)"
        shadow_truncated = shadow_body[:max_body_len] if shadow_body else "(empty)"

        return f"""You are an expert API compatibility analyzer. Compare these two API responses and assess the risk of deploying the shadow version.

**Endpoint:** {endpoint}
**Status codes match:** {status_match}
**Latency delta:** {latency_delta_ms}ms

**Production Response:**
```json
{prod_truncated}
```

**Shadow Response:**
```json
{shadow_truncated}
```

**Field-level diffs:**
{diff_summary}

Analyze the differences and respond with a JSON object containing:
{{
    "similarity_score": <float 0.0 to 1.0, where 1.0 = identical semantics>,
    "explanation": "<human-readable explanation of differences and their impact>",
    "has_structural_changes": <boolean, true if response structure changed>,
    "breaking_changes": [<list of breaking change descriptions>],
    "safe_differences": [<list of differences safe to ignore, like timestamps, IDs, etc.>]
}}

Rules:
- Ignore field ordering differences.
- Ignore timestamp, created_at, updated_at, request_id, trace_id differences.
- Focus on semantic meaning, not exact text matches.
- Flag field removals as more severe than additions.
- Type changes (string→number) are high severity.
- Additional fields are usually safe (non-breaking).
- Empty/null changes may indicate bugs.
"""

    # ── Heuristic fallback ──────────────────────────

    def _heuristic_compare(
        self,
        prod_body: str,
        shadow_body: str,
        endpoint: str,
        field_diffs: Optional[List],
        status_match: bool,
        latency_delta_ms: int,
    ) -> Dict[str, Any]:
        if prod_body == shadow_body:
            return {
                "similarity_score": 1.0,
                "explanation": "Responses are identical.",
                "has_structural_changes": False,
                "breaking_changes": [],
                "safe_differences": [],
            }

        diff_count = len(field_diffs) if field_diffs else 0
        structural_changes = False
        breaking = []
        safe = []

        if field_diffs:
            for d in field_diffs:
                if hasattr(d, 'dict'):
                    d = d.dict()
                elif hasattr(d, 'model_dump'):
                    d = d.model_dump()

                dtype = d.get("diff_type", "")
                path = d.get("path", "")

                safe_fields = {"timestamp", "created_at", "updated_at", "request_id", "trace_id"}
                field_name = path.split("/")[-1] if path else ""

                if field_name.lower() in safe_fields:
                    safe.append(f"Ignored safe field change: {path}")
                    continue

                if dtype == "REMOVED":
                    breaking.append(f"Field removed: {path}")
                    structural_changes = True
                elif dtype == "ADDED":
                    safe.append(f"New field added: {path}")
                    structural_changes = True
                elif dtype == "CHANGED":
                    breaking.append(f"Value changed at: {path}")

        if diff_count == 0:
            similarity = 0.9 if status_match else 0.5
        else:
            base = 1.0
            base -= len(breaking) * 0.15
            base -= len(safe) * 0.02
            if not status_match:
                base -= 0.3
            similarity = max(0.0, min(1.0, base))

        explanation_parts = []
        if not status_match:
            explanation_parts.append("Status codes differ between production and shadow.")
        if breaking:
            explanation_parts.append(f"Found {len(breaking)} potentially breaking change(s).")
        if safe:
            explanation_parts.append(f"Found {len(safe)} safe/ignorable difference(s).")
        if abs(latency_delta_ms) > 100:
            explanation_parts.append(f"Significant latency delta of {latency_delta_ms}ms detected.")

        explanation = " ".join(explanation_parts) if explanation_parts else "Minor differences detected."

        return {
            "similarity_score": round(similarity, 3),
            "explanation": explanation,
            "has_structural_changes": structural_changes,
            "breaking_changes": breaking,
            "safe_differences": safe,
        }
