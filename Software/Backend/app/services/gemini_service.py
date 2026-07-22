# pyrefly: ignore [missing-import]
"""
Servicio multi-proveedor de IA para Shared Reasoning.
Soporta Gemini, OpenAI y modelos locales (Ollama/LM Studio).
"""
import base64
import json
import os
import time
import contextvars

# Request-scoped custom API keys for users
user_gemini_key_var = contextvars.ContextVar("user_gemini_key", default=None)
user_openai_key_var = contextvars.ContextVar("user_openai_key", default=None)

from app.core.config import settings
from app.schemas.project import Project
from app.schemas.verification import Verification
from app.schemas.logical_netlist import LogicalNetlist

# Activar/desactivar el paso de verificación de nets (segundo LLM call).
# Poner en True para mayor precisión, False para ahorrar quota.
ENABLE_NETLIST_VERIFY = os.environ.get("ENABLE_NETLIST_VERIFY", "true").lower() in ("true", "1", "yes")

NETLIST_VERIFY_PROMPT = (
    "Eres un verificador experto de netlists de circuitos eléctricos.\n\n"
    "Se te proporciona una imagen de un circuito y una netlist extraída previamente por otra IA. "
    "Tu tarea es VERIFICAR si los nets (nodos eléctricos) están correctamente asignados.\n\n"
    "ERROR COMÚN A BUSCAR: Dos nets que en realidad son el MISMO conductor continuo "
    "(unidos por un cable directo SIN ningún componente entre ellos) pero que fueron separados incorrectamente. "
    "Esto ocurre frecuentemente cuando un cable vertical u horizontal conecta un riel con un nodo de junction.\n\n"
    "INSTRUCCIONES:\n"
    "1. Mira la imagen del circuito.\n"
    "2. Para CADA par de nets en la netlist, pregúntate: '¿Hay un cable directo (sin componente) entre algún pin del Net X y algún pin del Net Y?'\n"
    "3. Si encuentras nets que deben fusionarse, fusiónalos: mueve todos los pines al net que tenga el nombre más apropiado y elimina el net sobrante.\n"
    "4. Devuelve la netlist CORREGIDA con el campo 'analysis' explicando qué nets fusionaste y por qué (o indicando que no hubo cambios).\n"
    "5. NO modifiques los componentes, solo corrige las asignaciones de nets.\n\n"
)


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
    "=== PASO 0: ANÁLISIS DETALLADO (CAMPO 'analysis') ===\n"
    "Antes de generar las listas, DEBES escribir un análisis profundo paso a paso en el campo 'analysis'. "
    "Inicia en el polo positivo de la fuente, traza la línea identificando con qué componentes se conecta directamente (creando el primer nodo). "
    "Presta MUCHA atención a los cruces y uniones (puntos donde 3 o más líneas se unen). "
    "Sigue las ramas para descubrir todos los nodos hasta llegar al polo negativo. Piensa en voz alta para no cometer errores en la topología.\n"
    "ERROR FRECUENTE A EVITAR: Cuando un cable vertical u horizontal conecta directamente un riel (ej. la barra superior) con un nodo central de junction, "
    "ese cable NO crea un nodo nuevo. Ambos extremos del cable son el MISMO net. "
    "Si puedes recorrer el cable de un punto a otro SIN atravesar ningún componente, son el mismo nodo eléctrico.\n\n"
    "=== PASO 1: IDENTIFICAR COMPONENTES ===\n"
    "Identifica todos los componentes: resistencias, LEDs, capacitores, transistores, baterías, etc. "
    "Para cada uno especifica id único (ej. R1, LED1, V1), tipo y valor.\n"
    "REGLA DE ORO: ¡NO INVENTES NINGÚN COMPONENTE! Extrae ÚNICAMENTE los que ves explícitamente en la imagen. Revisa dos veces para asegurarte de que no estás alucinando resistencias extras.\n\n"
    "Pines estándar por tipo:\n"
    "- LEDs/Diodos: ['anode', 'cathode']\n"
    "- Resistencias/Interruptores: ['pin1', 'pin2']\n"
    "- Transistores: ['emitter', 'base', 'collector']\n"
    "- Baterías/Fuentes: type='battery' (NUNCA uses voltage_source), pines: ['positive', 'negative']\n\n"
    "REGLA CRÍTICA PARA FUENTES DE PODER: Si el diagrama muestra nodos de VCC, VDD, 5V, 9V o similares, y un nodo de Tierra (GND), DEBES INFERIR E INCLUIR un componente tipo 'battery' (ej. id='B1') en la lista de componentes, incluso si no hay una batería dibujada físicamente. El pin 'positive' de esta batería corresponde al nodo VCC, y el pin 'negative' corresponde al nodo GND.\n\n"
    "=== PASO 2: TRAZAR CADA CABLE/LÍNEA ===\n"
    "Sigue CADA línea/cable del esquemático desde un terminal de componente hasta otro. "
    "DEBES extraer todas las conexiones. Un circuito con 0 conexiones es un error grave. "
    "No asumas topologías comunes (serie, paralelo). Traza físicamente cada conexión.\n\n"
    "=== PASO 3: IDENTIFICAR NODOS (NETS) ===\n"
    "Un NODO (net) es un punto conductor donde 2 o más pines de componentes se encuentran.\n\n"
    "REGLAS CRÍTICAS para asignar nets:\n"
    "1. TRAZA CADA LÍNEA: Sigue cada cable/línea del diagrama desde su origen hasta su destino. "
    "Dos pines están en la misma net SÓLO si hay un camino conductor directo entre ellos SIN pasar por otro componente.\n"
    "2. JUNCTIONS (NODOS DE 3+ CONEXIONES): Si ves un punto donde 3 o más líneas se cruzan/unen "
    "(representado a menudo por un punto negro o una intersección en T), TODOS esos pines comparten la misma net. "
    "Este tipo de nodo es MUY IMPORTANTE y no debe dividirse en nets separadas.\n"
    "3. NO AGRUPES PINES INCORRECTAMENTE: El hecho de que dos componentes tengan funciones similares "
    "(ej. dos resistencias) NO significa que sus pines estén en la misma net. "
    "Solo comparten net si hay una línea conductora directa entre ellos.\n"
    "4. CADA COMPONENTE SEPARA NETS: La corriente que entra por un pin de un componente sale por otro pin. "
    "Los pines de un mismo componente NUNCA están en la misma net (eso sería un cortocircuito).\n"
    "5. CONDUCTORES CONTINUOS NO SE DIVIDEN: Una línea conductora, sin importar si dobla, tiene intersecciones en T, o se alarga por todo el esquema, es UN SOLO NET. "
    "NUNCA dividas un conductor continuo en múltiples nets a menos que un componente lo interrumpa. Si dos cables están unidos directamente, forman exactamente el mismo nodo.\n\n"
    "=== PASO 4: VERIFICACIÓN DE FUSIÓN DE NETS ===\n"
    "Antes de dar tu respuesta final, revisa CADA par de nets que hayas creado y pregúntate: "
    "'¿Existe un cable directo (sin componente) que conecte un pin del Net X con un pin del Net Y?' "
    "Si la respuesta es SÍ, fusiona ambos nets en uno solo. Repite hasta que no queden nets fusionables.\n\n"
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

    def __init__(self, api_key: str = None):
        from google import genai
        from google.genai import types
        self._genai = genai
        self._types = types
        key = api_key or settings.GEMINI_API_KEY
        self.client = genai.Client(api_key=key)
        self.model_name = getattr(self, "model_name", None) or "gemini-2.5-flash"

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

    def __init__(self, api_key: str = None):
        from openai import OpenAI
        key = api_key or settings.OPENAI_API_KEY
        if not key or key.strip() == "":
            raise ValueError("No se configuró una clave de API para OpenAI (OPENAI_API_KEY). Agrégala en el panel de Configuración.")
        self.client = OpenAI(api_key=key, timeout=60.0, max_retries=3)
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
    Ahora `provider` puede ser un string del modelo (ej. 'gpt-4-turbo', 'gemini-1.5-pro').
    """
    if provider is None:
        provider = settings.MODEL_PROVIDER or "gemini-2.5-flash"

    model_string = provider.lower().strip()

    if "gemini" in model_string:
        real_provider = "gemini"
        model_name = model_string if model_string != "gemini" else "gemini-2.5-flash"
    elif "gpt" in model_string or "o1" in model_string or "openai" in model_string:
        real_provider = "openai"
        model_name = model_string if model_string != "openai" else "gpt-4o"
    elif model_string == "local":
        real_provider = "local"
        model_name = "local"
    else:
        real_provider = "gemini"
        model_name = "gemini-2.5-flash"

    # Read from contextvars for user-provided custom API keys
    user_gemini_key = user_gemini_key_var.get()
    user_openai_key = user_openai_key_var.get()

    print("==================================================")
    print(f"[AI Service API Keys Check] Provider: {real_provider} | Model: {model_name}")
    print(f"  - Default Gemini Key: {settings.GEMINI_API_KEY}")
    print(f"  - Default OpenAI Key: {settings.OPENAI_API_KEY}")
    print(f"  - User Gemini Key:    {user_gemini_key}")
    print(f"  - User OpenAI Key:    {user_openai_key}")
    print("==================================================")

    if real_provider == "gemini":
        if user_gemini_key:
            print("[AI Service] Usando API key de Gemini proporcionada por el usuario")
            instance = GeminiProvider(api_key=user_gemini_key)
        else:
            instance = GeminiProvider()
        instance.model_name = model_name
        return instance
    elif real_provider == "openai":
        if user_openai_key:
            print("[AI Service] Usando API key de OpenAI proporcionada por el usuario")
            instance = OpenAIProvider(api_key=user_openai_key)
        else:
            instance = OpenAIProvider()
        instance.model_name = model_name
        return instance
    elif real_provider == "local":
        return LocalProvider()
    else:
        raise ValueError(f"Proveedor de IA no reconocido: '{provider}'. Usa modelos de gemini, openai o local.")


# Singleton de compatibilidad (usa el proveedor configurado en .env por defecto)
gemini_service = get_ai_service()