# pyrefly: ignore [missing-import]
from openai import OpenAI

from app.core.config import settings


from app.schemas.project import Project
from app.schemas.verification import Verification

class OpenAIService:

    def __init__(self):
        # Selecciona el cliente y el modelo según la configuración (Nube vs Local)
        if settings.MODEL_PROVIDER == "local":
            self.client = OpenAI(
                base_url=settings.LOCAL_API_BASE,
                api_key="local-placeholder-key"  # Ollama/LM Studio no requieren API key, pero la librería sí exige un string no vacío
            )
            self.model_name = settings.LOCAL_MODEL_NAME
        else:
            self.client = OpenAI(
                api_key=settings.OPENAI_API_KEY
            )
            self.model_name = "gpt-4o"

    def extract_project_from_image(self, base64_image: str) -> Project:
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]

        response = self.client.beta.chat.completions.parse(
            model=self.model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Analiza esta imagen del circuito en protoboard. "
                                "Identifica todos los componentes (ej. resistencias, LEDs, capacitores, circuitos integrados, cables), "
                                "sus valores/tipos y las coordenadas específicas de sus pines en la protoboard (ej., A5, E5). "
                                "IMPORTANTE: Todo el texto generado (títulos, descripciones de los pasos de ensamblaje) debe estar en ESPAÑOL.\n\n"
                                "REGLAS CRÍTICAS PARA DISEÑO Y TOPOLOGÍA:\n"
                                "1. Estándares de nombres de pines:\n"
                                "   - LEDs: Deben tener exactamente dos pines llamados 'anode' y 'cathode'.\n"
                                "   - Fuentes de alimentación/Baterías: Deben tener al menos dos pines, típicamente llamados 'positive' y 'negative'.\n"
                                "   - Capacitores polarizados: Deben tener pines llamados 'anode' y 'cathode'.\n"
                                "   - Resistencias/Interruptores: Pueden usar nombres genéricos como 'pin1' y 'pin2'.\n"
                                "2. Consistencia en las Conexiones:\n"
                                "   - Cada elemento en 'connections' DEBE conectar pines usando sus nombres EXACTOS definidos en la lista 'pins' de sus respectivos componentes.\n"
                                "   - Nunca conectes a un ID de componente sin especificar un nombre de pin válido que pertenezca a ese componente.\n"
                                "3. Conexiones a las líneas de alimentación (Power Rails):\n"
                                "   - Si un pin va conectado a las líneas positivo o negativo (líneas de alimentación laterales) de la protoboard, define su posición como '+' o '-' respectivamente.\n"
                                "   - Incluye las conexiones a las líneas de alimentación de forma explícita en la lista de conexiones, usando to_component='power_rail' y to_pin='positive' o 'negative'.\n"
                                "4. Coherencia Eléctrica:\n"
                                "   - Asegúrate de que los valores sean funcionales (ej., no coloques una resistencia de 10k en serie con un LED en un circuito de 5V/12V porque limitará demasiado la corriente; una resistencia típica de serie para LED debe estar entre 220Ω y 1kΩ).\n\n"
                                "Luego, genera las instrucciones lógicas de ensamblaje paso a paso para construir este circuito, escritas completamente en ESPAÑOL."
                            )
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format=Project
        )
        return response.choices[0].message.parsed

    def verify_step_from_image(self, base64_image: str, step_number: int) -> Verification:
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]

        response = self.client.beta.chat.completions.parse(
            model=self.model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                f"Analiza esta foto de la protoboard. Verifica si el usuario ha ensamblado correctamente el paso {step_number} de su circuito. "
                                "Revisa si el componente objetivo está colocado en los pines correctos. "
                                "Si es correcto, establece is_correct en True. Si no, establécelo en False y explica el error exacto (ej., colocado en la fila A6 en lugar de la A5).\n\n"
                                "IMPORTANTE: Todos los mensajes y explicaciones generados deben estar escritos en ESPAÑOL."
                            )
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format=Verification
        )
        return response.choices[0].message.parsed


openai_service = OpenAIService()