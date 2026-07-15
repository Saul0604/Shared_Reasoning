from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime


class ChallengeCompletion(SQLModel, table=True):
    """Records each daily challenge completion for a user.
    Only one completion per user per day is allowed.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    completed_date: date = Field(index=True)  # Date only (no time)
    score: int  # Number of correct answers
    total_questions: int  # Total questions in the challenge
    xp_earned: int  # XP awarded
    created_at: datetime = Field(default_factory=datetime.utcnow)
