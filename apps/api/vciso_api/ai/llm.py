"""Thin wrapper around the Anthropic SDK with structured (Pydantic) outputs.

- Model from ANTHROPIC_MODEL (default claude-opus-5-5).
- Server-side refusal fallback enabled (fallbacks="default").
- Client data is sent only for inference; Anthropic API inputs are not used for model training
  by default under commercial terms. No secrets are ever included in prompts."""
from __future__ import annotations

import logging
from typing import TypeVar

import anthropic
from pydantic import BaseModel

from ..config import get_settings

log = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


class AIUnavailable(Exception):
    pass


def enabled() -> bool:
    return bool(get_settings().anthropic_api_key)


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=get_settings().anthropic_api_key, max_retries=2, timeout=180)


def structured(system: str, user: str, schema: type[T], *, effort: str = "medium", max_tokens: int = 16000) -> T:
    if not enabled():
        raise AIUnavailable("ANTHROPIC_API_KEY not configured")
    try:
        resp = _client().beta.messages.parse(
            model=get_settings().anthropic_model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
            output_format=schema,
            output_config={"effort": effort},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )
    except anthropic.RateLimitError as e:
        raise AIUnavailable("AI rate limit reached, try again shortly") from e
    except anthropic.APIStatusError as e:
        log.warning("Claude API error %s", e.status_code)
        raise AIUnavailable(f"AI service error ({e.status_code})") from e
    except anthropic.APIConnectionError as e:
        raise AIUnavailable("AI service unreachable") from e
    if resp.stop_reason == "refusal" or resp.parsed_output is None:
        raise AIUnavailable("The AI declined or returned no structured output")
    return resp.parsed_output
