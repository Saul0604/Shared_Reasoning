# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health
from app.routers import extract
from app.routers import verify
from app.routers import chat
from app.routers import auth
from app.core.database import create_db_and_tables

app = FastAPI(
    title = "Shared Reasoning API",
    version = "0.1.0"
)

# Inicializar Base de Datos en el arranque
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(extract.router)
app.include_router(verify.router)
app.include_router(chat.router)
app.include_router(auth.router)

from app.core.config import settings

print("OPENAI KEY:", settings.OPENAI_API_KEY)
print("GEMINI KEY:", settings.GEMINI_API_KEY)
