from fastapi import APIRouter, Depends
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.challenge import DailyChallenge
from app.services.gemini_service import get_ai_service

router = APIRouter()

@router.get("/daily", response_model=DailyChallenge)
def get_daily_challenge(current_user: User = Depends(get_current_user)):
    ai_service = get_ai_service()
    
    skill_level = current_user.skill_level or "Principiante"
    
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
