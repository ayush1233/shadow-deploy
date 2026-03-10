"""
LLM Provider abstraction for the AI Comparison Service.

Supports multiple backends:
  - gemini  : Google Gemini API (cloud, default)
  - ollama  : Local Ollama instance (self-hosted, privacy-safe)

Switch via LLM_PROVIDER env var.
"""

import json
import logging
import asyncio
import os
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

logger = logging.getLogger("ai-service.llm_provider")


class LLMProvider(ABC):
    """Base class for LLM providers."""

    @abstractmethod
    def is_configured(self) -> bool:
        ...

    @abstractmethod
    async def generate_json(self, prompt: str) -> Dict[str, Any]:
        """Send a prompt and return parsed JSON response."""
        ...

    @abstractmethod
    def generate_json_sync(self, prompt: str) -> Dict[str, Any]:
        """Synchronous version for non-async contexts (e.g. configurator)."""
        ...


class GeminiProvider(LLMProvider):
    """Google Gemini API provider."""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.model = None

        if api_key:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash")
            logger.info("Gemini provider configured successfully")
        else:
            logger.warning("No GEMINI_API_KEY — Gemini provider not available")

    def is_configured(self) -> bool:
        return self.model is not None

    async def generate_json(self, prompt: str) -> Dict[str, Any]:
        import google.generativeai as genai

        response = await asyncio.to_thread(
            self.model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)

    def generate_json_sync(self, prompt: str) -> Dict[str, Any]:
        import requests as req

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.5-flash:generateContent?key={self.api_key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json",
            },
        }
        resp = req.post(url, json=payload, timeout=15)
        resp.raise_for_status()
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        # Strip markdown fences if present
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
        return json.loads(text)


class OllamaProvider(LLMProvider):
    """Local Ollama provider — keeps all data on-premise."""

    def __init__(
        self,
        base_url: str = "",
        model: str = "",
    ):
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3.1")
        self._configured: Optional[bool] = None
        logger.info(f"Ollama provider: base_url={self.base_url}, model={self.model}")

    def _check_connection(self) -> bool:
        """Verify Ollama is reachable (cached after first call)."""
        if self._configured is not None:
            return self._configured
        try:
            import requests as req
            resp = req.get(f"{self.base_url}/api/tags", timeout=5)
            self._configured = resp.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama not reachable at {self.base_url}: {e}")
            self._configured = False
        return self._configured

    def is_configured(self) -> bool:
        return self._check_connection()

    def _parse_response(self, text: str) -> Dict[str, Any]:
        """Extract JSON from LLM response, handling markdown fences."""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        # Try to find first { ... } block if leading text exists
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            text = text[start : end + 1]

        return json.loads(text)

    async def generate_json(self, prompt: str) -> Dict[str, Any]:
        import requests as req

        def _call():
            resp = req.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.1},
                    "format": "json",
                },
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json()["response"]

        text = await asyncio.to_thread(_call)
        return self._parse_response(text)

    def generate_json_sync(self, prompt: str) -> Dict[str, Any]:
        import requests as req

        resp = req.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.1},
                "format": "json",
            },
            timeout=120,
        )
        resp.raise_for_status()
        return self._parse_response(resp.json()["response"])


def create_provider(
    provider_name: Optional[str] = None,
    gemini_api_key: str = "",
) -> Optional[LLMProvider]:
    """
    Factory: create the right LLM provider based on config.

    Priority:
      1. Explicit provider_name
      2. LLM_PROVIDER env var
      3. Auto-detect: Gemini if key present, else Ollama if reachable, else None
    """
    name = (provider_name or os.getenv("LLM_PROVIDER", "")).strip().lower()
    gemini_key = gemini_api_key or os.getenv("GEMINI_API_KEY", "")

    if name == "gemini":
        p = GeminiProvider(api_key=gemini_key)
        return p if p.is_configured() else None

    if name == "ollama":
        p = OllamaProvider()
        return p if p.is_configured() else None

    # Auto-detect
    if gemini_key:
        return GeminiProvider(api_key=gemini_key)

    ollama = OllamaProvider()
    if ollama.is_configured():
        logger.info("Auto-detected running Ollama instance — using local LLM")
        return ollama

    logger.warning("No LLM provider available — falling back to heuristic comparison")
    return None
