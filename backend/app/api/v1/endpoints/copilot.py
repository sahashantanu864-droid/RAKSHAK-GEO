from fastapi import APIRouter, HTTPException, Depends
from app.schemas.copilot import ChatRequest, ChatResponse
from app.services.copilot_service import CopilotService

router = APIRouter(prefix="/copilot", tags=["LLM Copilot"])

def get_copilot_service() -> CopilotService:
    return CopilotService()

@router.post("/chat", response_model=ChatResponse)
def chat_with_copilot(
    request: ChatRequest,
    service: CopilotService = Depends(get_copilot_service)
):
    """
    Send a message to the AI Copilot and get a response.
    Includes the conversation history and the context of the page the user is on.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages array cannot be empty.")
        
    try:
        response_text = service.generate_chat_response(
            messages=request.messages,
            context_type=request.context_type
        )
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
