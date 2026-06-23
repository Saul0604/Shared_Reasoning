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
                                "Analyze this breadboard circuit image. "
                                "Identify all components (e.g. resistors, LEDs, capacitors, ICs, wires), "
                                "their values/types, and the specific coordinates of their pins on the breadboard (e.g., A5, E5). "
                                "Then, generate logical step-by-step assembly instructions to build this circuit."
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
                                f"Analyze this breadboard photo. Verify if the user has correctly assembled step {step_number} of their circuit. "
                                "Check if the target component is placed in the correct pins. "
                                "If it is correct, set is_correct to True. If not, set it to False and explain the exact error (e.g., placed on row A6 instead of A5)."
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