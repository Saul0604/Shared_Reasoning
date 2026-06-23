# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from app.routers import health
from app.routers import extract

app = FastAPI(
    title = "Shared Reasoning API",
    version = "0.1.0"
)

app.include_router(health.router)
app.include_router(extract.router)

from app.core.config import settings

print(settings.OPENAI_API_KEY)