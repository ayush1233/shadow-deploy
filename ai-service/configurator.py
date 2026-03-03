"""
configurator.py

Uses Gemini AI to parse natural language instructions into structured NGINX proxy port configurations.
"""

import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Fallback defaults if AI fails
DEFAULT_PROD_PORT = 3000
DEFAULT_SHADOW_PORT = 4000

class ProxyConfigurator:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found. Natural language configuration will use fallback heuristics.")

    def parse_instruction(self, instruction: str) -> Dict[str, int]:
        """
        Parses a natural language instruction to extract production and shadow ports.
        Returns a dict: {"production_port": 3000, "shadow_port": 4000}
        """
        if not instruction or not instruction.strip():
            return {"production_port": DEFAULT_PROD_PORT, "shadow_port": DEFAULT_SHADOW_PORT}

        if self.api_key:
            try:
                return self._parse_with_gemini(instruction)
            except Exception as e:
                logger.error(f"Gemini parsing failed: {e}. Falling back to heuristics.")
        
        return self._parse_with_heuristics(instruction)

    def _parse_with_gemini(self, instruction: str) -> Dict[str, int]:
        import requests
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"
        
        prompt = f"""
        Extract the production port and shadow (new version/v2/mirror) port from the following natural language request.
        Return ONLY a strict JSON object with two integer fields: "production_port" and "shadow_port".
        If a port is not explicitly mentioned but implied, or if you cannot determine one, use 3000 for production and 4000 for shadow.
        Do not return any markdown formatting, just the raw JSON.
        
        User Request: "{instruction}"
        """
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        result_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        # Strip markdown code blocks if the API ignored the prompt instruction
        if result_text.startswith("```json"):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith("```"):
            result_text = result_text[3:-3].strip()
            
        parsed = json.loads(result_text)
        
        return {
            "production_port": int(parsed.get("production_port", DEFAULT_PROD_PORT)),
            "shadow_port": int(parsed.get("shadow_port", DEFAULT_SHADOW_PORT))
        }

    def _parse_with_heuristics(self, instruction: str) -> Dict[str, int]:
        """Simple fallback regex parsing if no API key is available"""
        import re
        
        ports = [int(p) for p in re.findall(r'\b[1-9][0-9]{3,4}\b', instruction)]
        result = {"production_port": DEFAULT_PROD_PORT, "shadow_port": DEFAULT_SHADOW_PORT}
        
        if len(ports) >= 2:
            result["production_port"] = ports[0]
            result["shadow_port"] = ports[1]
        elif len(ports) == 1:
            result["production_port"] = ports[0]
            
        return result
