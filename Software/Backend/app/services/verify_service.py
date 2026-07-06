from app.schemas.verify import VerifyRequest, VerifyResponse
from app.schemas.verification import Verification, ComponentVerification
from app.services.gemini_service import gemini_service

class VerifyService:

    def verify(self, request: VerifyRequest) -> VerifyResponse:
        # Si la imagen es ficticia, usamos la simulación
        if not request.image or len(request.image) < 100 or "base64_string_aqui" in request.image:
            if request.step_number == 1:
                verification = Verification(
                    is_correct=True,
                    message="¡Excelente! La resistencia R1 está conectada correctamente en A5 y E5.",
                    components=[
                        ComponentVerification(
                            component_id="R1",
                            status="correct",
                            detected_pins=["A5", "E5"]
                        )
                    ]
                )
            else:
                verification = Verification(
                    is_correct=False,
                    message="Se detectó un error de colocación en el LED1.",
                    components=[
                        ComponentVerification(
                            component_id="LED1",
                            status="incorrect",
                            detected_pins=["F6", "F7"],
                            error_message="El ánodo del LED1 está en F6, pero debería estar en F5."
                        )
                    ]
                )

            return VerifyResponse(
                verification=verification
            )

        # De lo contrario, realizamos la verificación real usando Gemini Vision
        verification = gemini_service.verify_step_from_image(request.image, request.step_number)
        return VerifyResponse(
            verification=verification
        )

