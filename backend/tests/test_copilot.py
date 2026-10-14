"""Unit Test Suite for LLM Copilot Service and Endpoint (T-020).

Verifies:
1. System prompt construction across context types ('general', 'optimization', 'timeline').
2. Fallback response when GEMINI_API_KEY is not configured (Mock mode).
3. API Endpoint /api/v1/copilot/chat validation (empty messages -> 400).
4. Full endpoint invocation and response contract.
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.copilot_service import CopilotService
from app.core.config import settings

client = TestClient(app, raise_server_exceptions=False)


def test_copilot_system_prompt_construction():
    """Verify system prompts are constructed correctly for different context types."""
    service = CopilotService()
    
    prompt_general = service._build_system_prompt("general")
    assert "RAKSHAK-GEO AI Copilot" in prompt_general
    assert "General Dashboard" in prompt_general

    prompt_opt = service._build_system_prompt("optimization")
    assert "Resource Optimization" in prompt_opt
    assert "ambulance and shelter allocations" in prompt_opt

    prompt_timeline = service._build_system_prompt("timeline")
    assert "Response Gap Timeline" in prompt_timeline
    assert "future gaps in medical capacity" in prompt_timeline


def test_copilot_chat_fallback_without_api_key():
    """Verify Copilot Service returns mock message when GEMINI_API_KEY is missing."""
    service = CopilotService()
    
    with patch.object(settings, "GEMINI_API_KEY", ""):
        messages = [{"role": "user", "content": "How many rescue boats are needed?"}]
        response = service.generate_chat_response(messages=messages, context_type="general")
        assert "mock mode" in response.lower()


def test_copilot_chat_endpoint_empty_messages():
    """Verify /api/v1/copilot/chat returns 400 Bad Request when messages list is empty."""
    resp = client.post("/api/v1/copilot/chat", json={"messages": [], "context_type": "general"})
    assert resp.status_code == 400
    assert "Messages array cannot be empty" in resp.json()["detail"]


def test_copilot_chat_endpoint_success():
    """Verify /api/v1/copilot/chat returns valid ChatResponse schema."""
    payload = {
        "messages": [
            {"role": "user", "content": "What is the current flood status?"}
        ],
        "context_type": "general"
    }
    resp = client.post("/api/v1/copilot/chat", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "response" in data
    assert isinstance(data["response"], str)
    assert len(data["response"]) > 0


@patch("app.services.copilot_service.genai.GenerativeModel")
def test_copilot_chat_with_mocked_gemini_api(mock_model_cls):
    """Verify Copilot Service formats history and calls Gemini API properly when API key is set."""
    mock_chat_instance = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Priority zones allocated successfully."
    mock_chat_instance.send_message.return_value = mock_response
    
    mock_model_instance = MagicMock()
    mock_model_instance.start_chat.return_value = mock_chat_instance
    mock_model_cls.return_value = mock_model_instance
    
    service = CopilotService()
    
    with patch.object(settings, "GEMINI_API_KEY", "dummy_key"):
        messages = [
            {"role": "user", "content": "Hello"},
            {"role": "model", "content": "Hi there! How can I help?"},
            {"role": "user", "content": "Optimize resources for Ward 5."}
        ]
        response_text = service.generate_chat_response(messages=messages, context_type="optimization")
        
        assert response_text == "Priority zones allocated successfully."
        mock_model_cls.assert_called_once()
        mock_model_instance.start_chat.assert_called_once()
        # Ensure the historical messages were formatted into Gemini schema
        history_arg = mock_model_instance.start_chat.call_args[1]["history"]
        assert len(history_arg) == 2
        assert history_arg[0]["role"] == "user"
        assert history_arg[0]["parts"] == ["Hello"]
        assert history_arg[1]["role"] == "model"
        assert history_arg[1]["parts"] == ["Hi there! How can I help?"]
        # Ensure latest message was sent to send_message
        mock_chat_instance.send_message.assert_called_once_with("Optimize resources for Ward 5.")
