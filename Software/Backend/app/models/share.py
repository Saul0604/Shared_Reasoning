from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class ProjectShare(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    chat_session_id: int = Field(foreign_key="chatsession.id", ondelete="CASCADE", index=True)
    shared_by_user_id: int = Field(foreign_key="user.id", index=True)
    shared_to_user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True) # Usuario receptor
    share_token: str = Field(unique=True, index=True) # Token único para el enlace compartido
    created_at: datetime = Field(default_factory=datetime.utcnow)
