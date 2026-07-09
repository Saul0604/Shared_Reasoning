from pydantic import BaseModel, Field
from typing import List, Optional, Literal

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
