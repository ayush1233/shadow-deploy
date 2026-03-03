"""
Pydantic models for the AI Comparison Service.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class FieldDiff(BaseModel):
    path: str = ""
    prod_value: str = ""
    shadow_value: str = ""
    diff_type: str = ""  # ADDED, REMOVED, CHANGED


class ComparisonRequest(BaseModel):
    request_id: str
    tenant_id: str = "default"
    endpoint: str = "/unknown"
    prod_body: str = ""
    shadow_body: str = ""
    field_diffs: Optional[List[FieldDiff]] = None
    status_match: bool = True
    latency_delta_ms: int = 0


class ComparisonResponse(BaseModel):
    request_id: str
    similarity_score: float = Field(ge=0.0, le=1.0)
    severity: str  # none, low, medium, high, critical
    risk_score: float = Field(ge=0.0, le=10.0)
    explanation: str
    recommended_action: str
    processing_time_ms: float = 0.0


class HealthResponse(BaseModel):
    status: str
    service: str
