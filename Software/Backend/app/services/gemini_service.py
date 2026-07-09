# pyrefly: ignore [missing-import]
"""
Servicio multi-proveedor de IA para Shared Reasoning.
Soporta Gemini, OpenAI y modelos locales (Ollama/LM Studio).
"""
import base64
import json

from app.core.config import settings
from app.schemas.project import Project
from app.schemas.verification import Verification
from app.schemas.logical_netlist import LogicalNetlist


# ============================================================
#  Prompts compartidos (DRY)
# ============================================================

EXTRACT_PROJECT_PROMPT = (
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

EXTRACT_NETLIST_PROMPT = (
    "Analiza esta imagen del circuito en protoboard o diagrama esquemático.\n\n"
    "Tu tarea consiste en extraer la representación lógica (Netlist) del circuito:\n\n"
    "=== PASO 1: IDENTIFICAR COMPONENTES ===\n"
    "Identifica todos los componentes: resistencias, LEDs, capacitores, transistores, baterías, etc. "
    "Para cada uno especifica id único (ej. R1, LED1, B1), tipo y valor.\n\n"
    "Pines estándar por tipo:\n"
    "- LEDs/Diodos: ['anode', 'cathode']\n"
    "- Resistencias/Interruptores: ['pin1', 'pin2']\n"
    "- Transistores: ['emitter', 'base', 'collector']\n"
    "- Baterías/Fuentes: ['positive', 'negative']\n\n"
    "=== PASO 2: TRAZAR CADA CABLE/LÍNEA ===\n"
    "Sigue CADA línea/cable del esquemático desde un terminal de componente hasta otro. "
    "No asumas topologías comunes (serie, paralelo). Traza físicamente cada conexión.\n\n"
    "=== PASO 3: IDENTIFICAR NODOS (NETS) ===\n"
    "Un NODO (net) es un punto conductor donde 2 o más pines de componentes se encuentran.\n\n"
    "REGLAS CRÍTICAS para asignar nets:\n"
    "1. TRAZA CADA LÍNEA: Sigue cada cable/línea del diagrama desde su origen hasta su destino. "
    "Dos pines están en la misma net SOLO si hay un camino conductor directo entre ellos SIN pasar por otro componente.\n"
    "2. JUNCTIONS (NODOS DE 3+ CONEXIONES): Si ves un punto donde 3 o más líneas se cruzan/unen "
    "(representado a menudo por un punto negro ● o una intersección en T), TODOS esos pines comparten la misma net. "
    "Este tipo de nodo es MUY IMPORTANTE y no debe dividirse en nets separadas.\n"
    "3. NO AGRUPES PINES INCORRECTAMENTE: El hecho de que dos componentes tengan funciones similares "
    "(ej. dos resistencias) NO significa que sus pines estén en la misma net. "
    "Solo comparten net si hay una línea conductora directa entre ellos.\n"
    "4. CADA COMPONENTE SEPARA NETS: La corriente que entra por un pin de un componente sale por otro pin. "
    "Los pines de un mismo componente NUNCA están en la misma net (eso sería un cortocircuito).\n\n"
    "=== EJEMPLO ===\n"
    "Para un circuito: V+ -> R1 -> LED1 -> [nodo] -> R2 -> GND, y también [nodo] -> LED2 -> GND:\n"
    "- Net_VCC: B1.positive, R1.pin1\n"
    "- Net_A: R1.pin2, LED1.anode\n"
    "- Net_X: LED1.cathode, R2.pin1, LED2.anode  (¡junction de 3 pines!)\n"
    "- Net_GND: B1.negative, R2.pin2, LED2.cathode\n\n"
    "IMPORTANTE: No te preocupes por posiciones físicas. "
    "Solo concéntrate en la conectividad eléctrica lógica del circuito."
)

VERIFY_STEP_PROMPT_TEMPLATE = (
    "Analiza esta foto de la protoboard. Verifica si el usuario ha ensamblado correctamente el paso {step_number} de su circuito. "
    "Revisa si el componente objetivo está colocado en los pines correctos. "
    "Si es correcto, establece is_correct en True. Si no, establécelo en False y explica el error exacto (ej., colocado en la fila A6 en lugar de la A5).\n\n"
    "IMPORTANTE: Todos los mensajes y explicaciones generados deben estar escritos en ESPAÑOL."
)


# ============================================================
#  Proveedor: Google Gemini
# ============================================================

class GeminiProvider:
    """Usa la API nativa de Google Gemini (google-genai)."""

    def __init__(self):
        from google import genai
        from google.genai import types
        self._genai = genai
        self._types = types
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-2.5-flash"

    def extract_project_from_image(self, base64_image: str) -> Project:
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]
        image_bytes = base64.b64decode(base64_image)
        types = self._types

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=EXTRACT_PROJECT_PROMPT),
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    ],
                ),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=Project,
            ),
        )
        parsed_data = json.loads(response.text)
        return Project.model_validate(parsed_data)

    def extract_logical_netlist_from_image(self, base64_image: str) -> LogicalNetlist:
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]
        image_bytes = base64.b64decode(base64_image)
        types = self._types

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=EXTRACT_NETLIST_PROMPT),
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    ],
                ),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=LogicalNetlist,
            ),
        )
        parsed_data = json.loads(response.text)
        return LogicalNetlist.model_validate(parsed_data)

    def verify_step_from_image(self, base64_image: str, step_number: int) -> Verification:
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]
        image_bytes = base64.b64decode(base64_image)
        types = self._types

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=VERIFY_STEP_PROMPT_TEMPLATE.format(step_number=step_number)),
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    ],
                ),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=Verification,
            ),
        )
        parsed_data = json.loads(response.text)
        return Verification.model_validate(parsed_data)

    def chat_completion(self, system_instruction: str, messages: list[dict]) -> str:
        types = self._types
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
        types = self._types
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
        parsed_data = json.loads(response.text)
        return response_schema.model_validate(parsed_data)


# ============================================================
#  Proveedor: OpenAI (GPT-4o)
# ============================================================

class OpenAIProvider:
    """Usa la API de OpenAI (requiere openai pip package)."""

    def __init__(self):
        from openai import OpenAI
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model_name = "gpt-4o"

    def _image_content(self, base64_image: str):
        """Helper para crear el bloque de imagen en formato OpenAI."""
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]
        return {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
        }

    def extract_project_from_image(self, base64_image: str) -> Project:
        response = self.client.beta.chat.completions.parse(
            model=self.model_name,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": EXTRACT_PROJECT_PROMPT},
                    self._image_content(base64_image),
                ]
            }],
            response_format=Project,
        )
        return response.choices[0].message.parsed

    def extract_logical_netlist_from_image(self, base64_image: str) -> LogicalNetlist:
        response = self.client.beta.chat.completions.parse(
            model=self.model_name,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": EXTRACT_NETLIST_PROMPT},
                    self._image_content(base64_image),
                ]
            }],
            response_format=LogicalNetlist,
        )
        return response.choices[0].message.parsed

    def verify_step_from_image(self, base64_image: str, step_number: int) -> Verification:
        response = self.client.beta.chat.completions.parse(
            model=self.model_name,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": VERIFY_STEP_PROMPT_TEMPLATE.format(step_number=step_number)},
                    self._image_content(base64_image),
                ]
            }],
            response_format=Verification,
        )
        return response.choices[0].message.parsed

    def chat_completion(self, system_instruction: str, messages: list[dict]) -> str:
        formatted_messages = [{"role": "system", "content": system_instruction}]
        for msg in messages:
            formatted_messages.append({"role": msg["role"], "content": msg["content"]})

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=formatted_messages,
        )
        return response.choices[0].message.content

    def structured_completion(self, prompt: str, response_schema):
        response = self.client.beta.chat.completions.parse(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            response_format=response_schema,
        )
        return response.choices[0].message.parsed


# ============================================================
#  Proveedor: Local (Ollama / LM Studio via OpenAI-compatible API)
# ============================================================

class LocalProvider:
    """Usa un servidor local con API compatible con OpenAI (Ollama, LM Studio, etc.)."""

    def __init__(self):
        from openai import OpenAI
        self.client = OpenAI(
            base_url=settings.LOCAL_API_BASE,
            api_key="local-placeholder-key",
        )
        self.model_name = settings.LOCAL_MODEL_NAME

    def _image_content(self, base64_image: str):
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]
        return {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
        }

    def _parse_json(self, text: str):
        import re
        # Buscar bloque markdown json primero
        match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            text = match.group(1)
        else:
            # Buscar cualquier bloque de código
            match = re.search(r"```\s*(.*?)\s*```", text, re.DOTALL)
            if match:
                text = match.group(1)
            else:
                # Fallback: Extraer desde la primera llave hasta la última
                start = text.find('{')
                end = text.rfind('}')
                if start != -1 and end != -1:
                    text = text[start:end+1]
        
        return json.loads(text.strip())

    def extract_project_from_image(self, base64_image: str) -> Project:
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": EXTRACT_PROJECT_PROMPT + "\n\nResponde SOLO con JSON válido que siga el schema de Project. No agregues markdown ni texto adicional."},
                    self._image_content(base64_image),
                ]
            }],
        )
        parsed_data = self._parse_json(response.choices[0].message.content)
        return Project.model_validate(parsed_data)

    def extract_logical_netlist_from_image(self, base64_image: str) -> LogicalNetlist:
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": EXTRACT_NETLIST_PROMPT + "\n\nResponde SOLO con JSON válido que siga el schema de LogicalNetlist. No agregues markdown ni texto adicional."},
                    self._image_content(base64_image),
                ]
            }],
        )
        parsed_data = self._parse_json(response.choices[0].message.content)
        return LogicalNetlist.model_validate(parsed_data)

    def verify_step_from_image(self, base64_image: str, step_number: int) -> Verification:
        prompt = VERIFY_STEP_PROMPT_TEMPLATE.format(step_number=step_number)
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt + "\n\nResponde SOLO con JSON válido que siga el schema de Verification. No agregues markdown ni texto adicional."},
                    self._image_content(base64_image),
                ]
            }],
        )
        parsed_data = self._parse_json(response.choices[0].message.content)
        return Verification.model_validate(parsed_data)

    def chat_completion(self, system_instruction: str, messages: list[dict]) -> str:
        formatted_messages = [{"role": "system", "content": system_instruction}]
        for msg in messages:
            formatted_messages.append({"role": msg["role"], "content": msg["content"]})

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=formatted_messages,
        )
        return response.choices[0].message.content

    def structured_completion(self, prompt: str, response_schema):
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt + "\n\nResponde SOLO con JSON válido. No agregues markdown ni texto adicional."}],
        )
        parsed_data = self._parse_json(response.choices[0].message.content)
        return response_schema.model_validate(parsed_data)


# ============================================================
#  Factory + Cache de instancias
# ============================================================

_provider_cache: dict = {}

def get_ai_service(provider: str = None):
    """
    Retorna la instancia del proveedor de IA solicitado.
    Cachea las instancias para no recrear clientes en cada request.
    """
    if provider is None:
        provider = settings.MODEL_PROVIDER or "gemini"

    provider = provider.lower().strip()

    if provider in _provider_cache:
        return _provider_cache[provider]

    if provider == "gemini":
        instance = GeminiProvider()
    elif provider == "openai":
        instance = OpenAIProvider()
    elif provider == "local":
        instance = LocalProvider()
    else:
        raise ValueError(f"Proveedor de IA no reconocido: '{provider}'. Usa 'gemini', 'openai' o 'local'.")

    _provider_cache[provider] = instance
    print(f"[AI Service] Inicializado proveedor: {provider} ({instance.__class__.__name__})")
    return instance


# Singleton de compatibilidad (usa el proveedor configurado en .env por defecto)
gemini_service = get_ai_service()