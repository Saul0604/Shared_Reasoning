from fastapi import APIRouter, Depends
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.challenge import DailyChallenge
from app.services.gemini_service import get_ai_service

router = APIRouter()

@router.get("/daily", response_model=DailyChallenge)
def get_daily_challenge(lang: str = "es", current_user: User = Depends(get_current_user)):
    ai_service = get_ai_service()
    
    skill_level = current_user.skill_level or "Principiante"
    
    if lang == "en":
        prompt = f"""
You are an expert basic electronics professor.
Generate a daily electronics challenge for a student at skill level: {skill_level}.
The challenge should evaluate their theoretical knowledge interactively.

INSTRUCTIONS FOR THE CHALLENGE:
1. Generate 3 questions in total.
2. Mix question types between 'multiple_choice' (multiple choice) and 'matching' (matching concepts).
3. For 'multiple_choice', provide 4 clear options and the index of the correct answer (0-3).
4. For 'matching', provide exactly 4 pairs of terms and definitions.
5. The title must be attractive and the description motivating.
6. The reward (xp_reward) must be 150 for Beginner, 250 for Intermediate, 350 for Advanced.
7. Questions should relate to electronics fundamentals, passive components, series/parallel circuits, Kirchhoff's and Ohm's laws.
8. Adjust the difficulty based on the level:
   - Beginner (if level is Principiante): Very basic concepts, symbols, elementary functions (e.g. what does a resistor do?, how is voltage measured?).
   - Intermediate (if level is Intermedio): Basic Ohm's Law calculations, series/parallel behavior, breadboard usage.
   - Advanced (if level is Avanzado): Power calculations, voltage/current dividers, simple loop/node analysis, transistor or capacitor usage.

IMPORTANT: Respond ONLY with valid JSON matching the provided schema. Do not add markdown backticks or any other text.
All text in the output JSON (title, description, questions, options, definitions, terms, hints) MUST be written in English.
"""
    else:
        prompt = f"""
Eres un profesor experto en electrónica básica.
Genera un reto diario de electrónica para un estudiante de nivel: {skill_level}.
El reto debe evaluar sus conocimientos teóricos de forma interactiva.

INSTRUCCIONES PARA EL RETO:
1. Genera 3 preguntas en total.
2. Mezcla tipos de preguntas entre 'multiple_choice' (selección múltiple) y 'matching' (relacionar conceptos).
3. Para 'multiple_choice', proporciona 4 opciones claras y el índice de la respuesta correcta (0-3).
4. Para 'matching', proporciona exactamente 4 pares de términos y definiciones.
5. El título debe ser atractivo y la descripción motivadora.
6. La recompensa (xp_reward) debe ser 150 para Principiante, 250 para Intermedio, 350 para Avanzado.
7. Las preguntas deben estar relacionadas con los fundamentos de electrónica, componentes pasivos, circuitos serie/paralelo, leyes de Kirchhoff y Ohm.
8. Para el nivel '{skill_level}', ajusta la dificultad de las preguntas:
   - Principiante: Conceptos muy básicos, símbolos, funciones elementales (ej. ¿qué hace una resistencia?, ¿cómo se mide el voltaje?).
   - Intermedio: Cálculos básicos con la Ley de Ohm, comportamiento en serie/paralelo, uso de protoboard.
   - Avanzado: Cálculos de potencia, divisores de tensión/corriente, análisis de mallas/nodos simples, uso de transistores o capacitores.

IMPORTANTE: Responde SOLO con el JSON válido siguiendo el esquema proporcionado. No agregues texto adicional.
"""

    # Se usa el provider configurado (gemini, openai, o local)
    challenge = ai_service.structured_completion(prompt, DailyChallenge)
    return challenge
