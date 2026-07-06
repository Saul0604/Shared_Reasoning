# pyrefly: ignore [missing-import]
from fastapi import APIRouter, File, UploadFile
import base64

from app.schemas.extract import ExtractResponse
from app.services.extract_service import ExtractService

router = APIRouter(
    prefix="/extract",
    tags=["Extract"],
)

service = ExtractService()


@router.post(
    "",
    response_model=ExtractResponse,
)
async def extract(file: UploadFile = File(...)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode("utf-8")
    return service.extract(base64_image)