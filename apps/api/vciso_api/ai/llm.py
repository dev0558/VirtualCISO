"""Thin wrapper around the AI provider SDKs with structured (Pydantic) outputs.

- AI_PROVIDER selects the provider explicitly (anthropic | gemini), so the service that receives client
  data never changes as a side effect of which key happens to be set.
- Anthropic: model from ANTHROPIC_MODEL, server-side refusal fallback enabled (fallbacks="default").
  API inputs are not used for model training by default under commercial terms.
- Gemini: model from GEMINI_MODEL, interactions are not stored server-side (store=False).
  Only keys on a billed Cloud project may process client data: on Google's unpaid tier, prompts can be
  used to improve products and read by human reviewers. Google cannot be asked which tier a key is on.
- Client data is sent only for inference. No secrets are ever included in prompts."""
from __future__ import annotations

import logging
from typing import TypeVar

import anthropic
from google import genai
from pydantic import BaseModel, ValidationError

from ..config import get_settings

log = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


class AIUnavailable(Exception):
    pass


def enabled() -> bool:
    s = get_settings()
    return bool(s.gemini_api_key if s.ai_provider == "gemini" else s.anthropic_api_key)


def describe() -> str:
    s = get_settings()
    return f"Gemini ({s.gemini_model})" if s.ai_provider == "gemini" else f"Claude ({s.anthropic_model})"


def structured(system: str, user: str, schema: type[T], *, effort: str = "medium", max_tokens: int = 16000) -> T:
    if get_settings().ai_provider == "gemini":
        return _gemini_structured(system, user, schema, max_tokens=max_tokens)
    return _anthropic_structured(system, user, schema, effort=effort, max_tokens=max_tokens)


def _anthropic_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=get_settings().anthropic_api_key, max_retries=2, timeout=180)


def _anthropic_structured(system: str, user: str, schema: type[T], *, effort: str, max_tokens: int) -> T:
    if not enabled():
        raise AIUnavailable("ANTHROPIC_API_KEY not configured")
    try:
        resp = _anthropic_client().beta.messages.parse(
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


def _gemini_client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key, http_options=genai.types.HttpOptions(timeout=180_000))


def _gemini_structured(system: str, user: str, schema: type[T], *, max_tokens: int) -> T:
    if not enabled():
        raise AIUnavailable("GEMINI_API_KEY not configured")
    client = _gemini_client()  # keep a reference: the SDK closes a Client once it is garbage collected
    try:
        resp = client.interactions.create(
            model=get_settings().gemini_model,
            input=user,
            system_instruction=system,
            generation_config={"max_output_tokens": max_tokens},
            response_format={"type": "text", "mime_type": "application/json", "schema": schema.model_json_schema()},
            store=False,
        )
    except Exception as e:  # the SDK's interaction errors live in a private module, so match on status instead
        code = getattr(e, "status_code", None)
        if code == 429:
            raise AIUnavailable("AI rate limit reached, try again shortly") from e
        if code is None:
            log.warning("Gemini API call failed: %s", type(e).__name__)
            raise AIUnavailable("AI service unavailable") from e
        log.warning("Gemini API error %s", code)
        raise AIUnavailable(f"AI service error ({code})") from e
    # A failed or blocked interaction arrives as a normal response, so check it before parsing.
    if resp.status != "completed" or not resp.output_text:
        raise AIUnavailable("The AI declined or returned no structured output")
    try:
        return schema.model_validate_json(resp.output_text)
    except ValidationError as e:
        raise AIUnavailable("The AI declined or returned no structured output") from e
