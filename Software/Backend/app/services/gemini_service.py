# pyrefly: ignore [missing-import]
from google import genai
from google.genai import types

from app.core.config import settings
from app.schemas.project import Project
from app.schemas.verification import Verification

import base64


class GeminiService:

    def __init__(self):
        # Selecciona el cliente y el modelo según la configuración (Nube vs Local)
        if settings.MODEL_PROVIDER == "local":
            # Para modelos locales compatibles con OpenAI API (Ollama, LM Studio, etc.)
            # se usa el cliente de Gemini apuntando a un servidor local
            from openai import OpenAI
            self.local_client = OpenAI(
                base_url=settings.LOCAL_API_BASE,
                api_key="local-placeholder-key"
            )
            self.model_name = settings.LOCAL_MODEL_NAME
            self.is_local = True
        else:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            self.model_name = "gemini-2.5-flash"
            self.is_local = False

    def extract_project_from_image(self, base64_image: str) -> Project:
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]

        image_bytes = base64.b64decode(base64_image)

        prompt_text = (
            "Analiza esta imagen del circuito en protoboard o diagrama esquemático. "
            "Identifica todos los componentes (ej. resistencias, LEDs, capacitores, circuitos integrados, cables, instrumentos), "
            "sus valores/tipos y las coordenadas específicas de sus pines en la protoboard.\n\n"
            "IMPORTANTE: Todo el texto generado (títulos, descripciones de los pasos de ensamblaje) debe estar en ESPAÑOL.\n\n"
            "REGLAS CRÍTICAS PARA DISEÑO Y TOPOLOGÍA:\n"
            "1. Diferenciación de Etiquetas vs Coordenadas de Protoboard:\n"
            "   - Las letras escritas en los diagramas (ej. A, B, C, D, E) son ETIQUETAS de los componentes (por ejemplo, A es la fuente, B es el switch, C es el LED). Úsalas como el 'id' del componente.\n"
            "   - NO confundas estas letras identificadoras con las filas/columnas físicas de la protoboard. Las posiciones físicas de los pines deben mapearse al campo 'breadboard'.\n"
            "2. Coordenadas de Componentes ('breadboard' en cada component):\n"
            "   - Si es un componente con dos terminales (como una resistencia), identifica las coordenadas de sus dos extremos en la protoboard: fila de inicio ('row_start' en minúscula, ej: 'a', 'b', 'c', 'd', 'e', '+', '-'), columna de inicio ('col_start' entero, ej: 5), fila de fin ('row_end' en minúscula) y columna de fin ('col_end' entero).\n"
            "3. Coordenadas de Conexiones/Cables ('breadboard' y 'wire_color' en cada connection):\n"
            "   - Cada cable de conexión debe incluir el color aproximado del cable en 'wire_color' (ej: 'rojo', 'negro', 'azul', 'amarillo').\n"
            "   - Debe incluir la ubicación exacta del cable en la protoboard usando 'breadboard' con 'from_row' (ej: 'a'), 'from_col' (ej: 1), 'to_row' (ej: 'e'), y 'to_col' (ej: 5).\n"
            "4. Detección de Instrumentación de Medida:\n"
            "   - Un círculo con la letra 'A' dentro representa un Amperímetro (type='ammeter').\n"
            "   - Un círculo con la letra 'V' dentro representa un Voltímetro (type='voltmeter').\n"
            "   - No los omitas ni los fusiones con otros componentes; son elementos individuales de la serie.\n"
            "5. Estándares de nombres de pines:\n"
            "   - LEDs y Capacitores polarizados: Deben tener exactamente dos pines llamados 'anode' y 'cathode'.\n"
            "   - Fuentes de alimentación/Baterías: Deben tener al menos dos pines, típicamente llamados 'positive' y 'negative'.\n"
            "   - Amperímetros/Voltímetros: Deben tener pines llamados 'positive' y 'negative'.\n"
            "   - Resistencias/Interruptores: Pueden usar nombres genéricos como 'pin1' y 'pin2'.\n"
            "6. Consistencia en las Conexiones:\n"
            "   - Cada elemento en 'connections' DEBE conectar pines usando sus nombres EXACTOS definidos en la lista 'pins' de sus respectivos componentes.\n"
            "   - Nunca conectes a un ID de componente sin especificar un nombre de pin válido que pertenezca a ese componente.\n"
            "   - Si el diagrama esquemático es un lazo cerrado, la lista de conexiones DEBE cerrar el circuito de vuelta a la fuente (ej. retornando al polo 'negative' de la fuente).\n"
            "7. Conexiones a las líneas de alimentación (Power Rails):\n"
            "   - Si un pin va conectado a las líneas positivo o negativo (líneas de alimentación laterales) de la protoboard, define su posición como '+' o '-' respectivamente.\n"
            "   - Incluye las conexiones a las líneas de alimentación de forma explícita en la lista de conexiones, usando to_component='power_rail' y to_pin='positive' o 'negative'.\n"
            "8. Coherencia Eléctrica:\n"
            "   - Asegúrate de que los valores sean funcionales (ej., no coloques una resistencia de 10k en serie con un LED en un circuito de 5V/12V porque limitará demasiado la corriente; una resistencia típica de serie para LED debe estar entre 220Ω y 1kΩ).\n\n"
            "Luego, genera las instrucciones lógicas de ensamblaje paso a paso para construir este circuito, escritas completamente en ESPAÑOL."
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=prompt_text),
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    ],
                ),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=Project,
            ),
        )

        import json
        parsed_data = json.loads(response.text)
        return Project.model_validate(parsed_data)

    def verify_step_from_image(self, base64_image: str, step_number: int) -> Verification:
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]

        image_bytes = base64.b64decode(base64_image)

        prompt_text = (
            f"Analiza esta foto de la protoboard. Verifica si el usuario ha ensamblado correctamente el paso {step_number} de su circuito. "
            "Revisa si el componente objetivo está colocado en los pines correctos. "
            "Si es correcto, establece is_correct en True. Si no, establécelo en False y explica el error exacto (ej., colocado en la fila A6 en lugar de la A5).\n\n"
            "IMPORTANTE: Todos los mensajes y explicaciones generados deben estar escritos en ESPAÑOL."
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=prompt_text),
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    ],
                ),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=Verification,
            ),
        )

        import json
        parsed_data = json.loads(response.text)
        return Verification.model_validate(parsed_data)

    def chat_completion(self, system_instruction: str, messages: list[dict]) -> str:
        """
        Realiza un chat completion usando Gemini.
        
        Args:
            system_instruction: El system prompt / instrucciones del sistema
            messages: Lista de dicts con 'role' y 'content' (roles: 'user', 'assistant', 'system')
        
        Returns:
            El texto de respuesta del modelo
        """
        # Construir los contenidos para Gemini
        # Los mensajes con role 'system' se agregan al system_instruction
        extra_system_parts = []
        chat_contents = []

        for msg in messages:
            role = msg["role"]
            content = msg["content"]

            if role == "system":
                extra_system_parts.append(content)
            elif role == "user":
                chat_contents.append(
                    types.Content(role="user", parts=[types.Part.from_text(text=content)])
                )
            elif role == "assistant":
                chat_contents.append(
                    types.Content(role="model", parts=[types.Part.from_text(text=content)])
                )

        # Combinar todas las instrucciones de sistema
        full_system = system_instruction
        if extra_system_parts:
            full_system += "\n\n" + "\n\n".join(extra_system_parts)

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=chat_contents,
            config=types.GenerateContentConfig(
                system_instruction=full_system,
            ),
        )

        return response.text

    def structured_completion(self, prompt: str, response_schema):
        """
        Realiza una completion con structured output (sin imagen).
        Usado por el nodo de corrección del agente LangGraph.
        """
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)],
                ),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
            ),
        )

        import json
        parsed_data = json.loads(response.text)
        return response_schema.model_validate(parsed_data)


gemini_service = GeminiService()
