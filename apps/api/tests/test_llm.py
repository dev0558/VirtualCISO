"""Gemini provider, exercised through the real SDK with HTTP mocked. No network, no real key."""
import json
import weakref
from types import SimpleNamespace

import httpx
import pytest
from google import genai
from pydantic import BaseModel, Field

from vciso_api.ai import llm
from vciso_api.config import get_settings


class Answer(BaseModel):
    answer: str
    confidence: int = Field(ge=0, le=100)


def completed(text: str, status: str = "completed") -> httpx.Response:
    return httpx.Response(200, json={"id": "i1", "status": status,
                                     "steps": [{"type": "model_output", "content": [{"type": "text", "text": text}]}]})


@pytest.fixture
def gemini(monkeypatch):
    """Switch to Gemini with a fake key; returns a setter for the mocked HTTP handler."""
    settings = get_settings()
    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "fictional-test-key")

    def use(handler):
        http = httpx.Client(transport=httpx.MockTransport(handler))
        client = genai.Client(api_key="fictional-test-key", http_options=genai.types.HttpOptions(httpx_client=http))
        monkeypatch.setattr(llm, "_gemini_client", lambda: client)

    return use


def test_returns_validated_output_and_does_not_store_the_interaction(gemini):
    seen = {}

    def handler(request):
        seen["body"] = json.loads(request.content)
        return completed('{"answer": "Yes", "confidence": 80}')

    gemini(handler)
    result = llm.structured("system text", "user text", Answer, max_tokens=500)

    assert result == Answer(answer="Yes", confidence=80)
    body = seen["body"]
    assert body["store"] is False
    assert body["model"] == get_settings().gemini_model
    assert body["input"] == "user text"
    assert body["system_instruction"] == "system text"
    assert body["generation_config"]["max_output_tokens"] == 500
    assert body["response_format"]["schema"]["required"] == ["answer", "confidence"]


@pytest.mark.parametrize("code,message", [
    (429, "rate limit"),
    (401, r"service error \(401\)"),
    (500, r"service error \(500\)"),
])
def test_http_errors_become_ai_unavailable(gemini, code, message):
    gemini(lambda request: httpx.Response(code, json={"error": {"code": code, "message": "x", "status": "X"}}))
    with pytest.raises(llm.AIUnavailable, match=message):
        llm.structured("s", "u", Answer)


def test_connection_failure_becomes_ai_unavailable(gemini):
    def handler(request):
        raise httpx.ConnectError("no route")

    gemini(handler)
    with pytest.raises(llm.AIUnavailable, match="AI service unavailable"):
        llm.structured("s", "u", Answer)


@pytest.mark.parametrize("response", [
    completed('{"answer": "Yes", "confidence": 80}', status="failed"),
    httpx.Response(200, json={"id": "i1", "status": "completed", "steps": []}),
    completed("not json"),
    completed('{"answer": "Yes", "confidence": 900}'),
], ids=["failed-status", "empty-output", "malformed-json", "violates-schema"])
def test_unusable_responses_become_ai_unavailable(gemini, response):
    gemini(lambda request: response)
    with pytest.raises(llm.AIUnavailable, match="no structured output"):
        llm.structured("s", "u", Answer)


def test_enabled_follows_the_selected_provider_only(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "ai_provider", "gemini")
    monkeypatch.setattr(settings, "gemini_api_key", "")
    monkeypatch.setattr(settings, "anthropic_api_key", "fictional-test-key")
    assert llm.enabled() is False
    with pytest.raises(llm.AIUnavailable, match="GEMINI_API_KEY"):
        llm.structured("s", "u", Answer)

    monkeypatch.setattr(settings, "ai_provider", "anthropic")
    assert llm.enabled() is True


def test_client_stays_alive_for_the_whole_request(gemini, monkeypatch):
    """The real SDK closes a Client when it is garbage collected, which mocks holding a reference hide."""

    class Interactions:
        def __init__(self, client):
            self.client = weakref.ref(client)

        def create(self, **kwargs):
            if self.client() is None:
                raise RuntimeError("Cannot send a request, as the client has been closed.")
            return SimpleNamespace(status="completed", output_text='{"answer": "Yes", "confidence": 80}')

    class ClosesWhenCollected:
        @property
        def interactions(self):
            return Interactions(self)

    monkeypatch.setattr(llm, "_gemini_client", ClosesWhenCollected)
    assert llm.structured("s", "u", Answer).answer == "Yes"
