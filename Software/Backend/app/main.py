# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from app.routers import health

app = FastAPI(
    title = "Shared Reasoning API",
    version = "0.1.0"
)

app.include_router(health.router)