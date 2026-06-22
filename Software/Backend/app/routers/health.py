# pyrefly: ignore [missing-import]
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def health():
    return {
        "status": "ok",
        "message": "Backend running"
    }