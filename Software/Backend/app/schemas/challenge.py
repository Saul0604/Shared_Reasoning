from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date

class MatchingPair(BaseModel):
    term: str = Field(description="El concepto a relacionar")
    definition: str = Field(description="La definición correspondiente")

class ChallengeQuestion(BaseModel):
    type: Literal["multiple_choice", "matching"] = Field(description="El tipo de pregunta")
    question: str = Field(description="El texto de la pregunta")
    options: Optional[List[str]] = Field(default=None, description="Solo para type='multiple_choice'. 4 opciones de respuesta.")
    correct_answer: Optional[int] = Field(default=None, description="Solo para type='multiple_choice'. Índice (0-3) de la respuesta correcta.")
    pairs: Optional[List[MatchingPair]] = Field(default=None, description="Solo para type='matching'. 4 pares de conceptos y definiciones.")
    hint: Optional[str] = Field(default=None, description="Una pista opcional para ayudar al usuario")

class DailyChallenge(BaseModel):
    title: str = Field(description="Título del reto (ej. Reto Diario: Fundamentos)")
    description: str = Field(description="Breve descripción del objetivo del reto")
    xp_reward: int = Field(description="Cantidad de XP que otorga (ej. 250)")
    questions: List[ChallengeQuestion] = Field(description="Lista de 3 a 5 preguntas para el reto")


class ChallengeCompleteRequest(BaseModel):
    """Request body when a user completes a daily challenge."""
    score: int = Field(description="Número de respuestas correctas")
    total_questions: int = Field(description="Total de preguntas en el reto")
    xp_earned: int = Field(description="XP ganado por completar el reto")


class StreakResponse(BaseModel):
    """Response containing the user's streak information."""
    current_streak: int = Field(description="Días consecutivos con reto completado")
    completed_today: bool = Field(description="Si el usuario ya completó el reto de hoy")
    total_completed: int = Field(description="Total de retos completados históricamente")
    total_xp: int = Field(default=0, description="Total de XP acumulada por retos completados")
    last_completion_date: Optional[str] = Field(default=None, description="Fecha del último reto completado (YYYY-MM-DD)")


class WeeklyProgressItem(BaseModel):
    """A single progress bar item."""
    key: str = Field(description="Identifier for the progress item")
    label_es: str = Field(description="Label in Spanish")
    label_en: str = Field(description="Label in English")
    percentage: int = Field(description="Progress percentage 0-100")
    current: int = Field(description="Current count")
    goal: int = Field(description="Goal count for 100%")


class WeeklyProgressResponse(BaseModel):
    """Weekly progress data for the current user."""
    items: List[WeeklyProgressItem] = Field(description="List of progress items")
    week_start: str = Field(description="Start of the week (Monday) in YYYY-MM-DD")
    week_end: str = Field(description="End of the week (Sunday) in YYYY-MM-DD")

