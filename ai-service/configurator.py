"""
configurator.py

Uses LLM provider to parse natural language instructions into structured
NGINX proxy port configurations. Supports Gemini and Ollama backends.
"""

import re
import logging
from typing import Dict, Optional

from comparison.llm_provider import LLMProvider

logger = logging.getLogger(__name__)

DEFAULT_PROD_PORT = 3000
DEFAULT_SHADOW_PORT = 4000


class ProxyConfigurator:
    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider

    def parse_instruction(self, instruction: str) -> Dict[str, int]:
        if not instruction or not instruction.strip():
            return {"production_port": DEFAULT_PROD_PORT, "shadow_port": DEFAULT_SHADOW_PORT}

        if self.provider and self.provider.is_configured():
            try:
                return self._parse_with_llm(instruction)
            except Exception as e:
                logger.error(f"LLM parsing failed: {e}. Falling back to heuristics.")

        return self._parse_with_heuristics(instruction)

    def _parse_with_llm(self, instruction: str) -> Dict[str, int]:
        prompt = f"""
        Extract the production port and shadow (new version/v2/mirror) port from the following natural language request.
        Return ONLY a strict JSON object with two integer fields: "production_port" and "shadow_port".
        If a port is not explicitly mentioned but implied, or if you cannot determine one, use 3000 for production and 4000 for shadow.
        Do not return any markdown formatting, just the raw JSON.

        User Request: "{instruction}"
        """
        parsed = self.provider.generate_json_sync(prompt)
        return {
            "production_port": int(parsed.get("production_port", DEFAULT_PROD_PORT)),
            "shadow_port": int(parsed.get("shadow_port", DEFAULT_SHADOW_PORT)),
        }

    def _parse_with_heuristics(self, instruction: str) -> Dict[str, int]:
        ports = [int(p) for p in re.findall(r'\b[1-9][0-9]{3,4}\b', instruction)]
        result = {"production_port": DEFAULT_PROD_PORT, "shadow_port": DEFAULT_SHADOW_PORT}
        if len(ports) >= 2:
            result["production_port"] = ports[0]
            result["shadow_port"] = ports[1]
        elif len(ports) == 1:
            result["production_port"] = ports[0]
        return result
