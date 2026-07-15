from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import date, timedelta
import random
import uuid

from app.models.user import User
from app.models.streak import ChallengeCompletion
from app.models.chat import ChatSession, ChatMessage
from app.routers.auth import get_current_user
from app.core.database import get_session
from app.schemas.challenge import (
    DailyChallenge, ChallengeCompleteRequest, StreakResponse,
    WeeklyProgressResponse, WeeklyProgressItem
)
from app.services.gemini_service import get_ai_service

router = APIRouter()

# Topic pools for variety
TOPICS_ES = [
    "Ley de Ohm y cálculos de resistencia",
    "Circuitos en serie y sus propiedades",
    "Circuitos en paralelo y sus propiedades",
    "Capacitores: tipos, carga y descarga",
    "Diodos y rectificación",
    "LEDs: polaridad y resistencia limitadora",
    "Fuentes de voltaje y corriente",
    "Lectura de código de colores de resistencias",
    "Uso del multímetro y mediciones",
    "Leyes de Kirchhoff (voltaje y corriente)",
    "Potencia eléctrica y disipación de calor",
    "Transistores BJT: funcionamiento básico",
    "Divisores de voltaje y corriente",
    "Inductores y sus aplicaciones",
    "Protoboard: conexiones y buenas prácticas",
    "Señales AC vs DC",
    "Transformadores y acoplamiento",
    "Filtros RC pasa-bajos y pasa-altos",
    "Semiconductores: conceptos fundamentales",
    "Seguridad eléctrica y prevención de cortocircuitos",
]

TOPICS_EN = [
    "Ohm's Law and resistance calculations",
    "Series circuits and their properties",
    "Parallel circuits and their properties",
    "Capacitors: types, charging and discharging",
    "Diodes and rectification",
    "LEDs: polarity and current-limiting resistors",
    "Voltage and current sources",
    "Resistor color code reading",
    "Multimeter usage and measurements",
    "Kirchhoff's Laws (voltage and current)",
    "Electrical power and heat dissipation",
    "BJT Transistors: basic operation",
    "Voltage and current dividers",
    "Inductors and their applications",
    "Breadboard: connections and best practices",
    "AC vs DC signals",
    "Transformers and coupling",
    "RC low-pass and high-pass filters",
    "Semiconductors: fundamental concepts",
    "Electrical safety and short circuit prevention",
]


@router.get("/daily", response_model=DailyChallenge)
def get_daily_challenge(lang: str = "es", current_user: User = Depends(get_current_user)):
    ai_service = get_ai_service()
    
    skill_level = current_user.skill_level or "Principiante"
    
    # Pick a random topic focus to ensure variety
    if lang == "en":
        topic = random.choice(TOPICS_EN)
    else:
        topic = random.choice(TOPICS_ES)
    
    # Unique seed to prevent caching/repetition
    unique_seed = str(uuid.uuid4())[:8]
    today_str = date.today().isoformat()
    
    if lang == "en":
        prompt = f"""
You are an expert basic electronics professor.
Generate a daily electronics challenge for a student at skill level: {skill_level}.
The challenge should evaluate their theoretical knowledge interactively.

TODAY'S FOCUS TOPIC: {topic}
(All questions MUST be specifically about this topic. Do NOT reuse generic questions.)
Generation seed: {unique_seed} | Date: {today_str}

INSTRUCTIONS FOR THE CHALLENGE:
1. Generate 3 questions in total, ALL related to the focus topic "{topic}".
2. Mix question types between 'multiple_choice' (multiple choice) and 'matching' (matching concepts).
3. For 'multiple_choice', provide 4 clear options and the index of the correct answer (0-3).
4. For 'matching', provide exactly 4 pairs of terms and definitions.
5. The title must be attractive, creative, and related to the topic "{topic}".
6. The reward (xp_reward) must be 150 for Beginner, 250 for Intermediate, 350 for Advanced.
7. Make the questions UNIQUE and CREATIVE. Avoid repeating common textbook questions.
8. Adjust the difficulty based on the level:
   - Beginner (if level is Principiante): Very basic concepts, symbols, elementary functions.
   - Intermediate (if level is Intermedio): Basic calculations, series/parallel behavior, breadboard usage.
   - Advanced (if level is Avanzado): Power calculations, dividers, simple loop/node analysis, transistor or capacitor usage.

IMPORTANT: Respond ONLY with valid JSON matching the provided schema. Do not add markdown backticks or any other text.
All text in the output JSON (title, description, questions, options, definitions, terms, hints) MUST be written in English.
"""
    else:
        prompt = f"""
Eres un profesor experto en electrónica básica.
Genera un reto diario de electrónica para un estudiante de nivel: {skill_level}.
El reto debe evaluar sus conocimientos teóricos de forma interactiva.

TEMA CENTRAL DE HOY: {topic}
(Todas las preguntas DEBEN estar específicamente relacionadas con este tema. NO reutilices preguntas genéricas.)
Semilla de generación: {unique_seed} | Fecha: {today_str}

INSTRUCCIONES PARA EL RETO:
1. Genera 3 preguntas en total, TODAS relacionadas con el tema "{topic}".
2. Mezcla tipos de preguntas entre 'multiple_choice' (selección múltiple) y 'matching' (relacionar conceptos).
3. Para 'multiple_choice', proporciona 4 opciones claras y el índice de la respuesta correcta (0-3).
4. Para 'matching', proporciona exactamente 4 pares de términos y definiciones.
5. El título debe ser atractivo, creativo y relacionado con el tema "{topic}".
6. La recompensa (xp_reward) debe ser 150 para Principiante, 250 para Intermedio, 350 para Avanzado.
7. Haz las preguntas ÚNICAS y CREATIVAS. Evita repetir preguntas comunes de libros de texto.
8. Para el nivel '{skill_level}', ajusta la dificultad de las preguntas:
   - Principiante: Conceptos muy básicos, símbolos, funciones elementales.
   - Intermedio: Cálculos básicos con la Ley de Ohm, comportamiento en serie/paralelo, uso de protoboard.
   - Avanzado: Cálculos de potencia, divisores de tensión/corriente, análisis de mallas/nodos simples, uso de transistores o capacitores.

IMPORTANTE: Responde SOLO con el JSON válido siguiendo el esquema proporcionado. No agregues texto adicional.
"""

    # Se usa el provider configurado (gemini, openai, o local)
    challenge = ai_service.structured_completion(prompt, DailyChallenge)
    return challenge


@router.post("/complete", response_model=StreakResponse)
def complete_challenge(
    body: ChallengeCompleteRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Register that the current user completed today's daily challenge.
    Returns the updated streak information.
    """
    today = date.today()
    
    # Check if user already completed a challenge today
    existing = session.exec(
        select(ChallengeCompletion)
        .where(ChallengeCompletion.user_id == current_user.id)
        .where(ChallengeCompletion.completed_date == today)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya completaste el reto de hoy / You already completed today's challenge"
        )
        
    if body.total_questions <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede completar un reto vacío / Cannot complete an empty challenge"
        )
    
    # Save the completion
    completion = ChallengeCompletion(
        user_id=current_user.id,
        completed_date=today,
        score=body.score,
        total_questions=body.total_questions,
        xp_earned=body.xp_earned,
    )
    session.add(completion)
    session.commit()
    
    # Calculate and return updated streak
    return _calculate_streak(current_user.id, session)


@router.get("/streak", response_model=StreakResponse)
def get_streak(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get the current user's streak information."""
    return _calculate_streak(current_user.id, session)


def _calculate_streak(user_id: int, session: Session) -> StreakResponse:
    """Calculate the consecutive day streak for a user.
    
    Logic:
    - Get all completion dates for the user, ordered descending.
    - Start from today and count backwards: if today has a completion it counts,
      otherwise start from yesterday.
    - Each consecutive day with a completion adds 1 to the streak.
    - The first gap breaks the streak.
    """
    # Fetch all unique completion dates ordered descending
    completions = session.exec(
        select(ChallengeCompletion)
        .where(ChallengeCompletion.user_id == user_id)
        .order_by(ChallengeCompletion.completed_date.desc())
    ).all()
    
    total_completed = len(completions)
    total_xp = sum(c.xp_earned for c in completions)
    
    if total_completed == 0:
        return StreakResponse(
            current_streak=0,
            completed_today=False,
            total_completed=0,
            total_xp=0,
            last_completion_date=None
        )
    
    # Get unique dates
    completion_dates = sorted(set(c.completed_date for c in completions), reverse=True)
    last_date = completion_dates[0]
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    completed_today = (last_date == today)
    
    # Start counting the streak
    # If the most recent completion is today, start from today.
    # If it's yesterday, start from yesterday.
    # Otherwise the streak is 0.
    if last_date == today:
        check_date = today
    elif last_date == yesterday:
        check_date = yesterday
    else:
        return StreakResponse(
            current_streak=0,
            completed_today=False,
            total_completed=total_completed,
            total_xp=total_xp,
            last_completion_date=str(last_date)
        )
    
    streak = 0
    date_set = set(completion_dates)
    
    while check_date in date_set:
        streak += 1
        check_date -= timedelta(days=1)
    
    return StreakResponse(
        current_streak=streak,
        completed_today=completed_today,
        total_completed=total_completed,
        total_xp=total_xp,
        last_completion_date=str(last_date)
    )


@router.get("/weekly-progress", response_model=WeeklyProgressResponse)
def get_weekly_progress(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get the current user's weekly progress across challenges, interactions, and labs."""
    today = date.today()
    # Calculate Monday of current week
    week_start = today - timedelta(days=today.weekday())  # Monday
    week_end = week_start + timedelta(days=6)  # Sunday
    
    from datetime import datetime
    week_start_dt = datetime.combine(week_start, datetime.min.time())
    week_end_dt = datetime.combine(week_end, datetime.max.time())
    
    # 1. Retos: unique days with completed challenges this week (goal: 7 days)
    challenge_completions = session.exec(
        select(ChallengeCompletion)
        .where(ChallengeCompletion.user_id == current_user.id)
        .where(ChallengeCompletion.completed_date >= week_start)
        .where(ChallengeCompletion.completed_date <= week_end)
    ).all()
    retos_days = len(set(c.completed_date for c in challenge_completions))
    retos_goal = 7
    retos_pct = min(100, round((retos_days / retos_goal) * 100))
    
    # 2. Interacciones: chat messages sent by the user this week (goal: 30 messages)
    chat_messages = session.exec(
        select(ChatMessage)
        .join(ChatSession, ChatMessage.chat_session_id == ChatSession.id)
        .where(ChatSession.user_id == current_user.id)
        .where(ChatMessage.role == "user")
        .where(ChatMessage.timestamp >= week_start_dt)
        .where(ChatMessage.timestamp <= week_end_dt)
    ).all()
    interactions_count = len(chat_messages)
    interactions_goal = 30
    interactions_pct = min(100, round((interactions_count / interactions_goal) * 100))
    
    # 3. Laboratorios: circuit sessions created/used this week (goal: 5 projects)
    lab_sessions = session.exec(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .where(ChatSession.is_archived == False)
        .where(ChatSession.created_at >= week_start_dt)
        .where(ChatSession.created_at <= week_end_dt)
    ).all()
    labs_count = len(lab_sessions)
    labs_goal = 5
    labs_pct = min(100, round((labs_count / labs_goal) * 100))
    
    items = [
        WeeklyProgressItem(
            key="retos",
            label_es="Retos",
            label_en="Challenges",
            percentage=retos_pct,
            current=retos_days,
            goal=retos_goal,
        ),
        WeeklyProgressItem(
            key="interacciones",
            label_es="Interacciones",
            label_en="Interactions",
            percentage=interactions_pct,
            current=interactions_count,
            goal=interactions_goal,
        ),
        WeeklyProgressItem(
            key="laboratorios",
            label_es="Laboratorios",
            label_en="Labs",
            percentage=labs_pct,
            current=labs_count,
            goal=labs_goal,
        ),
    ]
    
    return WeeklyProgressResponse(
        items=items,
        week_start=str(week_start),
        week_end=str(week_end),
    )

