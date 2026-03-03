"""
Shadow API Validation Platform — AI Comparison Service
FastAPI application with Google Gemini integration for semantic comparison.
"""

import os
import logging
import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter, Histogram, Gauge

from models import ComparisonRequest, ComparisonResponse, HealthResponse
from comparison.semantic_comparator import SemanticComparator
from comparison.pii_masker import PIIMasker
from comparison.risk_scorer import RiskScorer

# ─────────────────────────────────────────
# Logging
# ─────────────────────────────────────────
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("ai-service")

# ─────────────────────────────────────────
# Metrics
# ─────────────────────────────────────────
COMPARISON_COUNTER = Counter("ai_comparisons_total", "Total AI comparisons performed")
COMPARISON_ERRORS = Counter("ai_comparison_errors_total", "Total AI comparison errors")
COMPARISON_LATENCY = Histogram("ai_comparison_duration_seconds", "AI comparison latency")
RISK_SCORE_GAUGE = Gauge("ai_current_risk_score", "Current risk score")

# ─────────────────────────────────────────
# Application Lifecycle
# ─────────────────────────────────────────

comparator: Optional[SemanticComparator] = None
pii_masker: Optional[PIIMasker] = None
risk_scorer: Optional[RiskScorer] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global comparator, pii_masker, risk_scorer

    logger.info("Initializing AI Comparison Service...")
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")

    comparator = SemanticComparator(api_key=gemini_api_key)
    pii_masker = PIIMasker()
    risk_scorer = RiskScorer()

    logger.info("AI Service initialized successfully")
    yield
    logger.info("Shutting down AI Service...")


# ─────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────

app = FastAPI(
    title="Shadow API - AI Comparison Service",
    description="Semantic comparison engine powered by Google Gemini",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")


# ─────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="healthy", service="ai-comparison-service")


@app.post("/api/v1/compare", response_model=ComparisonResponse)
async def compare(request: ComparisonRequest):
    """
    Perform AI-powered semantic comparison between production and shadow responses.
    Pipeline:
        1. PII masking
        2. Gemini semantic comparison
        3. Risk score computation
        4. Severity classification
    """
    start_time = time.time()
    COMPARISON_COUNTER.inc()

    try:
        logger.info(
            f"Starting AI comparison [request_id={request.request_id}, "
            f"endpoint={request.endpoint}]"
        )

        # Step 1: PII Masking
        masked_prod = pii_masker.mask(request.prod_body)
        masked_shadow = pii_masker.mask(request.shadow_body)

        logger.debug(f"PII masking complete for request_id={request.request_id}")

        # Step 2: Semantic Comparison via Gemini
        ai_result = await comparator.compare(
            prod_body=masked_prod,
            shadow_body=masked_shadow,
            endpoint=request.endpoint,
            field_diffs=request.field_diffs,
            status_match=request.status_match,
            latency_delta_ms=request.latency_delta_ms,
        )

        # Step 3: Risk Score
        risk_score = risk_scorer.calculate(
            similarity_score=ai_result.get("similarity_score", 0.5),
            has_status_mismatch=not request.status_match,
            latency_delta_ms=request.latency_delta_ms,
            field_diff_count=len(request.field_diffs) if request.field_diffs else 0,
            has_structural_changes=ai_result.get("has_structural_changes", False),
        )

        # Step 4: Build response
        severity = risk_scorer.classify_severity(risk_score)
        recommended_action = risk_scorer.recommend_action(risk_score, severity)

        duration = time.time() - start_time
        COMPARISON_LATENCY.observe(duration)
        RISK_SCORE_GAUGE.set(risk_score)

        response = ComparisonResponse(
            request_id=request.request_id,
            similarity_score=ai_result.get("similarity_score", 0.0),
            severity=severity,
            risk_score=risk_score,
            explanation=ai_result.get("explanation", "No explanation available"),
            recommended_action=recommended_action,
            processing_time_ms=round(duration * 1000, 2),
        )

        logger.info(
            f"AI comparison complete [request_id={request.request_id}, "
            f"similarity={response.similarity_score:.2f}, severity={severity}, "
            f"risk={risk_score:.1f}, duration={duration:.3f}s]"
        )

        return response

    except Exception as e:
        COMPARISON_ERRORS.inc()
        logger.error(f"AI comparison failed [request_id={request.request_id}]: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI comparison failed: {str(e)}")


from configurator import ProxyConfigurator
from nginx_updater import NginxConfigurator
from pydantic import BaseModel

class ConfigureRequest(BaseModel):
    instruction: str

# Configurator instances
proxy_configurator = ProxyConfigurator()
# Note: In a real docker environment, the python app would need to mount the nginx.conf
# For this platform, we assume /app/nginx.conf or similar is mounted, or 
# it's located using an environment variable. We will point it to the absolute path 
# we know or the mapped volume path.
# Inside docker-compose, ai-service doesn't mount nginx.conf. 
# We'll use the environment variable NGINX_CONF_PATH or default to a dummy local path for now.
nginx_conf_path = os.getenv("NGINX_CONF_PATH", "/etc/nginx/nginx.conf")
nginx_updater = NginxConfigurator(nginx_conf_path)

@app.post("/api/v1/configure-proxy")
async def configure_proxy(request: ConfigureRequest):
    """
    Accepts a natural language instruction and dynamically updates the NGINX proxy ports.
    """
    logger.info(f"Received natural language configuration request: '{request.instruction}'")
    
    try:
        # Parse natural language using Gemini
        ports = proxy_configurator.parse_instruction(request.instruction)
        
        prod_port = ports["production_port"]
        shadow_port = ports["shadow_port"]
        
        # Update the NGINX configuration file
        success = nginx_updater.update_ports(prod_port, shadow_port)
        
        if success:
            return {
                "status": "success",
                "message": f"Successfully updated NGINX proxy to route Production -> {prod_port}, Shadow -> {shadow_port}. Container needs restart to apply.",
                "parsed_ports": ports
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update NGINX config file.")
            
    except Exception as e:
        logger.error(f"Failed to configure proxy: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/status")
async def service_status():
    return {
        "service": "ai-comparison-service",
        "gemini_configured": comparator.is_configured() if comparator else False,
        "pii_masker_active": pii_masker is not None,
        "risk_scorer_active": risk_scorer is not None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

