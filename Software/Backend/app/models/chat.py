from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import datetime
import json

class ChatSessionBase(SQLModel):
    title: str = Field(default="Nuevo Circuito")
    user_id: int = Field(foreign_key="user.id", index=True)
    schema_image_base64: Optional[str] = Field(default=None)
    is_favorite: bool = Field(default=False)

class ChatSession(ChatSessionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatMessageBase(SQLModel):
    role: str  # "user" | "assistant" | "system"
    content: str

class ChatMessage(ChatMessageBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_session_id: int = Field(foreign_key="chatsession.id", ondelete="CASCADE", index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Contexto persistido serializado en JSON (opcional)
    project_context_json: Optional[str] = Field(default=None)
    current_step: Optional[int] = Field(default=None)

# Schemas para validación y APIs
class ChatSessionCreate(SQLModel):
    title: Optional[str] = "Nuevo Circuito"
    schema_image_base64: Optional[str] = None
    is_favorite: Optional[bool] = False

class ChatSessionRead(ChatSessionBase):
    id: int
    created_at: datetime

class ChatMessageRead(ChatMessageBase):
    id: int
    chat_session_id: int
    timestamp: datetime
    current_step: Optional[int] = None
    project_context_json: Optional[str] = None
