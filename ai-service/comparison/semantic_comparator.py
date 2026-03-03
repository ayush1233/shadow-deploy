"""
Semantic Comparator using Google Gemini API.
Computes similarity score, generates human-readable explanations,
and classifies the severity of API response differences.
"""

import json
import logging
import asyncio
from typing import Dict, Any, List, Optional

import google.generativeai as genai

logger = logging.getLogger("ai-service.semantic_comparator")


class SemanticComparator:
    """
    Uses Google Gemini to perform semantic comparison of API responses.
    Ignores non-critical differences (timestamps, field ordering)
    and focuses on meaningful behavioral changes.
    """

    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.model = None

        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash")
            logger.info("Gemini API configured successfully")
        else:
            logger.warning("No GEMINI_API_KEY provided — using fallback heuristic comparison")

    def is_configured(self) -> bool:
        return self.model is not None

    async def compare(
        self,
        prod_body: str,
        shadow_body: str,
        endpoint: str,
        field_diffs: Optional[List] = None,
        status_match: bool = True,
        latency_delta_ms: int = 0,
    ) -> Dict[str, Any]:
        """
        Perform semantic comparison. If Gemini is configured, uses LLM.
        Otherwise falls back to heuristic analysis.
        """
        if self.model:
            return await self._gemini_compare(
                prod_body, shadow_body, endpoint,
                field_diffs, status_match, latency_delta_ms
            )
        else:
            return self._heuristic_compare(
                prod_body, shadow_body, endpoint,
                field_diffs, status_match, latency_delta_ms
            )

    async def _gemini_compare(
        self,
        prod_body: str,
        shadow_body: str,
        endpoint: str,
        field_diffs: Optional[List],
        status_match: bool,
        latency_delta_ms: int,
    ) -> Dict[str, Any]:
        """Use Gemini for intelligent semantic comparison."""

        prompt = self._build_prompt(
            prod_body, shadow_body, endpoint,
            field_diffs, status_match, latency_delta_ms
        )

        try:
            # Run the synchronous Gemini API call in a thread pool
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=1024,
                    response_mime_type="application/json",
                ),
            )

            result = json.loads(response.text)

            return {
                "similarity_score": float(result.get("similarity_score", 0.5)),
                "explanation": result.get("explanation", "No explanation generated"),
                "has_structural_changes": result.get("has_structural_changes", False),
                "breaking_changes": result.get("breaking_changes", []),
                "safe_differences": result.get("safe_differences", []),
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            # Fallback to heuristic if Gemini response isn't valid JSON
            return self._heuristic_compare(
                prod_body, shadow_body, endpoint,
                field_diffs, status_match, latency_delta_ms
            )
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            return self._heuristic_compare(
                prod_body, shadow_body, endpoint,
                field_diffs, status_match, latency_delta_ms
            )

    def _build_prompt(
        self,
        prod_body: str,
        shadow_body: str,
        endpoint: str,
        field_diffs: Optional[List],
        status_match: bool,
        latency_delta_ms: int,
    ) -> str:
        """Build the comparison prompt for Gemini."""

        diff_summary = "No field-level diffs available."
        if field_diffs:
            diff_lines = []
            for d in field_diffs[:20]:  # Limit to 20 diffs
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

        # Truncate bodies to avoid token limits
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

    def _heuristic_compare(
        self,
        prod_body: str,
        shadow_body: str,
        endpoint: str,
        field_diffs: Optional[List],
        status_match: bool,
        latency_delta_ms: int,
    ) -> Dict[str, Any]:
        """Fallback heuristic comparison when Gemini is unavailable."""

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

                # Ignore known safe fields
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

        # Calculate similarity
        if diff_count == 0:
            similarity = 0.9 if status_match else 0.5
        else:
            # Reduce similarity based on diff count and type
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
