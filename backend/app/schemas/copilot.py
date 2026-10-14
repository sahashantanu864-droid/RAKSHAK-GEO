from pydantic import BaseModel, Field
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the sender: 'user' or 'model'")
    content: str = Field(..., description="Message content")

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Conversation history including the latest user message")
    context_type: Optional[str] = Field("general", description="Type of context to inject (e.g. 'general', 'optimization', 'timeline')")

class ChatResponse(BaseModel):
    response: str = Field(..., description="The response from the Copilot")
