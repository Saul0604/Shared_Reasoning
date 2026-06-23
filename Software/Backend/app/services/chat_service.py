from app.schemas.chat import ChatRequest, ChatResponse
from app.services.openai_service import openai_service

class ChatService:

    def chat(self, request: ChatRequest) -> ChatResponse:
        # System instructions
        system_content = (
            "Eres un tutor experto y amigable de electrónica para el proyecto "
            "'Shared Reasoning: Human–AI Co-execution of Physical Tasks'. "
            "Tu misión es ayudar a estudiantes a armar circuitos paso a paso sobre una protoboard. "
            "Responde de forma clara, directa y estructurada. Si el usuario te pregunta sobre un componente "
            "o error, explícale la teoría básica si es necesario para que aprenda."
        )

        messages = [
            {"role": "system", "content": system_content}
        ]

        # Inyectar el contexto actual del circuito si el frontend lo proporciona
        if request.circuit_context:
            messages.append({
                "role": "system",
                "content": f"El contexto del circuito actual cargado es: {request.circuit_context}"
            })

        # Cargar historial
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

        # Consumir el cliente de OpenAI del openai_service ya inicializado
        response = openai_service.client.chat.completions.create(
            model=openai_service.model_name,
            messages=messages
        )

        reply = response.choices[0].message.content
        return ChatResponse(reply=reply)
