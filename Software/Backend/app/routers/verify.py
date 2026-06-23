# pyrefly: ignore [missing-import]
from fastapi import APIRouter, File, UploadFile, Form
import base64
from app.schemas.verify import VerifyRequest, VerifyResponse
from app.services.verify_service import VerifyService

router = APIRouter(
    prefix="/verify",
    tags=["Verify"],
)

service = VerifyService()

@router.post(
    "",
    response_model=VerifyResponse,
)
async def verify(step_number: int = Form(...), file: UploadFile = File(...)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode("utf-8")
    request = VerifyRequest(image=base64_image, step_number=step_number)
    return service.verify(request)
