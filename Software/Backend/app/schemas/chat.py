from pydantic import BaseModel
from typing import Optional, Any

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    circuit_context: Optional[Any] = None  # Optional current project/circuit state to guide the reply

class ChatResponse(BaseModel):
    reply: str
