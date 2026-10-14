import logging
from typing import List, Dict
import google.generativeai as genai

from app.core.config import settings
from app.schemas.copilot import ChatMessage

logger = logging.getLogger(__name__)

# Configure Gemini AI once
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY is not set. Copilot will run in mock mode or fail.")

class CopilotService:
    def __init__(self):
        # We use a standard generative model
        self.model_name = 'gemini-1.5-flash'
        
    def _build_system_prompt(self, context_type: str) -> str:
        """
        Builds the system prompt based on the context type requested.
        In a real scenario, this would query the DB for active flood status,
        resource allocations, etc., and inject it.
        """
        base_prompt = (
            "You are the RAKSHAK-GEO AI Copilot, an expert disaster response assistant. "
            "Your role is to help operators manage flood situations, optimize resource allocation, "
            "and plan for future response gaps.\n"
        )
        
        if context_type == "optimization":
            return base_prompt + (
                "Current Context: Resource Optimization.\n"
                "You are currently helping the user optimize ambulance and shelter allocations. "
                "Provide advice on prioritizing critical zones based on current risk."
            )
        elif context_type == "timeline":
            return base_prompt + (
                "Current Context: Response Gap Timeline.\n"
                "You are currently helping the user analyze future gaps in medical capacity. "
                "Advise on preemptive evacuations or requesting additional field hospitals."
            )
            
        # General context
        return base_prompt + (
            "Current Context: General Dashboard.\n"
            "The active incident is 'Sabarmati Basin Flood Response Operation'. "
            "Be concise, helpful, and prioritize saving lives."
        )

    def generate_chat_response(self, messages: List[ChatMessage], context_type: str = "general") -> str:
        """
        Calls the Gemini API with the conversation history and system context.
        """
        if not settings.GEMINI_API_KEY:
            # Fallback for local testing without API key
            return "I am running in mock mode because no GEMINI_API_KEY was provided. Please configure it to chat with me!"
            
        system_instruction = self._build_system_prompt(context_type)
        
        # Convert schema/dict messages to Gemini format
        # Gemini format: [{'role': 'user', 'parts': ['msg']}, {'role': 'model', 'parts': ['resp']}]
        history = []
        # Exclude the very last message to use as the "new" message
        for msg in messages[:-1]:
            role_val = msg.role if hasattr(msg, "role") else (msg.get("role") if isinstance(msg, dict) else "user")
            content_val = msg.content if hasattr(msg, "content") else (msg.get("content") if isinstance(msg, dict) else "")
            role = "user" if role_val == "user" else "model"
            history.append({"role": role, "parts": [content_val]})
            
        last_msg_obj = messages[-1]
        last_message = last_msg_obj.content if hasattr(last_msg_obj, "content") else (last_msg_obj.get("content") if isinstance(last_msg_obj, dict) else "")
        
        try:
            # Instantiate the model with the system instruction
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            chat = model.start_chat(history=history)
            response = chat.send_message(last_message)
            return response.text
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return (
                "I am currently operating in offline/fallback mode. "
                "I can assist with standard flood monitoring, resource allocation advice, and scenario analysis."
            )
