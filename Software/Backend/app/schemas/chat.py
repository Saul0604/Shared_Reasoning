from pydantic import BaseModel
from typing import Optional, Any


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    current_step: Optional[int] = None
    last_verification_feedback: Optional[str] = None
    circuit_context: Optional[Any] = None  # Generic/backwards compatibility
    project_context: Optional[Any] = None  # Full Project schema dict/JSON


class ChatResponse(BaseModel):
    reply: str

