from app.schemas.chat import ChatRequest, ChatResponse
from app.services.gemini_service import gemini_service
import json


class ChatService:

    def chat(self, request: ChatRequest) -> ChatResponse:
        # System instructions con lineamientos pedagógicos claros
        system_content = (
            "Eres un tutor experto y amigable de electrónica para el proyecto "
            "'Shared Reasoning: Human–AI Co-execution of Physical Tasks'. "
            "Tu misión es guiar de manera pedagógica a estudiantes a armar circuitos reales sobre una protoboard.\n\n"
            "REGLAS DE COMPORTAMIENTO:\n"
            "1. Responde de forma clara, directa y estructurada usando Markdown (listas, negritas y emojis relativos a circuitos electrónicos).\n"
            "2. Nunca des la respuesta directamente si el usuario comete un error; guíalo con preguntas socráticas o pistas claras sobre qué verificar (ej. polaridad, cables en la misma columna, etc.) para que él mismo descubra la solución.\n"
            "3. Explica brevemente la teoría electrónica que hay detrás si el usuario parece no entender por qué algo se conecta de cierta forma.\n"
            "4. Habla siempre en ESPAÑOL latino de forma amigable e inspiradora.\n"
        )

        messages = []

        # Inyectar el contexto de proyecto/circuito si existe
        if request.project_context:
            try:
                # Convertir a cadena JSON legible
                context_str = json.dumps(request.project_context, indent=2, ensure_ascii=False)
            except Exception:
                context_str = str(request.project_context)
            messages.append({
                "role": "system",
                "content": f"INFORMACIÓN DEL CIRCUITO ACTUAL (Esquema objetivo):\n{context_str}"
            })
        elif request.circuit_context:
            messages.append({
                "role": "system",
                "content": f"INFORMACIÓN DEL CIRCUITO ACTUAL:\n{request.circuit_context}"
            })

        # Inyectar paso actual
        if request.current_step is not None:
            messages.append({
                "role": "system",
                "content": f"El estudiante está intentando realizar el Paso {request.current_step} del ensamblaje actualmente."
            })

        # Inyectar feedback del último error de verificación
        if request.last_verification_feedback:
            messages.append({
                "role": "system",
                "content": (
                    f"ATENCIÓN: El último intento de verificación por cámara del estudiante en el paso {request.current_step or ''} "
                    f"FALLÓ con el siguiente feedback del sistema de visión:\n"
                    f"'{request.last_verification_feedback}'\n"
                    "Usa esta información para orientar al estudiante sobre cómo corregir este error físico específico."
                )
            })

        # Cargar historial de conversación
        for h in request.history:
            messages.append({
                "role": h.role,
                "content": h.content
            })

        # Agregar mensaje actual del usuario
        messages.append({
            "role": "user",
            "content": request.message
        })

        # Consumir el servicio de Gemini
        reply = gemini_service.chat_completion(system_content, messages)
        return ChatResponse(reply=reply)

