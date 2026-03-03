"""
PII Masker — Masks sensitive fields before sending data to AI models.
"""

import re
import json
import logging
from typing import Dict, Set

logger = logging.getLogger("ai-service.pii_masker")

# Default sensitive field patterns
DEFAULT_SENSITIVE_FIELDS: Set[str] = {
    "password", "passwd", "secret", "token", "api_key", "apikey",
    "access_token", "refresh_token", "authorization", "auth",
    "ssn", "social_security", "credit_card", "card_number",
    "cvv", "cvc", "pin", "account_number",
    "email", "phone", "phone_number", "mobile",
    "address", "street", "zip", "zip_code", "postal_code",
    "date_of_birth", "dob", "birth_date",
    "driver_license", "passport", "national_id",
}

# Regex patterns for common PII
PII_PATTERNS = {
    "email": re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'),
    "phone": re.compile(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'),
    "ssn": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    "credit_card": re.compile(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b'),
    "ip_address": re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'),
    "jwt_token": re.compile(r'eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*'),
}

MASK_VALUE = "***MASKED***"


class PIIMasker:
    """
    Masks personally identifiable information and sensitive data
    from API response bodies before sending them to AI models.
    """

    def __init__(self, extra_fields: Set[str] = None):
        self.sensitive_fields = DEFAULT_SENSITIVE_FIELDS.copy()
        if extra_fields:
            self.sensitive_fields.update(extra_fields)

    def mask(self, body: str) -> str:
        """
        Mask PII in the given response body.
        Handles both JSON and plain text.
        """
        if not body or not body.strip():
            return body

        try:
            data = json.loads(body)
            masked = self._mask_json(data)
            return json.dumps(masked)
        except (json.JSONDecodeError, TypeError):
            return self._mask_text(body)

    def _mask_json(self, data) -> any:
        """Recursively mask sensitive fields in JSON data."""
        if isinstance(data, dict):
            masked = {}
            for key, value in data.items():
                if self._is_sensitive_key(key):
                    masked[key] = MASK_VALUE
                else:
                    masked[key] = self._mask_json(value)
            return masked
        elif isinstance(data, list):
            return [self._mask_json(item) for item in data]
        elif isinstance(data, str):
            return self._mask_text(data)
        else:
            return data

    def _mask_text(self, text: str) -> str:
        """Apply regex-based PII masking to plain text."""
        masked = text
        for pattern_name, pattern in PII_PATTERNS.items():
            masked = pattern.sub(f"[{pattern_name.upper()}_MASKED]", masked)
        return masked

    def _is_sensitive_key(self, key: str) -> bool:
        """Check if a field name indicates sensitive data."""
        normalized = key.lower().replace("-", "_").replace(" ", "_")
        return normalized in self.sensitive_fields
