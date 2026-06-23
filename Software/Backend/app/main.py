# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from app.routers import health
from app.routers import extract
from app.routers import verify
from app.routers import chat

app = FastAPI(
    title = "Shared Reasoning API",
    version = "0.1.0"
)

app.include_router(health.router)
app.include_router(extract.router)
app.include_router(verify.router)
app.include_router(chat.router)

from app.core.config import settings

print(settings.OPENAI_API_KEY)