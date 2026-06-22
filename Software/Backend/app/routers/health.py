# pyrefly: ignore [missing-import]
from fastapi import APIRouter

router = APIRouter(
    prefix="/health",
    tags=["Health"]
)

@router.get("/")
def health():
    return {
        "status": "ok",
        "message": "Backend running"
    }