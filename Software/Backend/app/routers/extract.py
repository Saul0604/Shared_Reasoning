# pyrefly: ignore [missing-import]
from fastapi import APIRouter

from app.schemas.extract import (
    ExtractRequest,
    ExtractResponse,
)

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
def extract(request: ExtractRequest):

    return service.extract()