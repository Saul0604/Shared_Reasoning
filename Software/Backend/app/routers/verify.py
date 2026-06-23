# pyrefly: ignore [missing-import]
from fastapi import APIRouter
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
def verify(request: VerifyRequest):
    return service.verify(request)
