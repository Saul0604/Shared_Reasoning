# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health
from app.routers import extract
from app.routers import verify
from app.routers import chat
from app.routers import auth
from app.core.database import create_db_and_tables
from app.models.streak import ChallengeCompletion  # noqa: F401 — imported so SQLModel creates the table

app = FastAPI(
    title = "Shared Reasoning API",
    version = "0.1.0"
)

# Inicializar Base de Datos en el arranque
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

from fastapi import Request
from app.services.gemini_service import user_gemini_key_var, user_openai_key_var

@app.middleware("http")
async def extract_user_api_keys_middleware(request: Request, call_next):
    gem_key = request.headers.get("x-gemini-api-key")
    open_key = request.headers.get("x-openai-api-key")
    
    token_gem = user_gemini_key_var.set(gem_key if gem_key else None)
    token_op = user_openai_key_var.set(open_key if open_key else None)
    
    try:
        response = await call_next(request)
        return response
    finally:
        user_gemini_key_var.reset(token_gem)
        user_openai_key_var.reset(token_op)

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

from app.routers import share
from app.routers import library
from app.routers import challenges

app.include_router(health.router)
app.include_router(extract.router)
app.include_router(verify.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(share.router)
app.include_router(library.router)
app.include_router(challenges.router, prefix="/challenges", tags=["challenges"])

from app.core.config import settings

print("OPENAI KEY:", settings.OPENAI_API_KEY)
print("GEMINI KEY:", settings.GEMINI_API_KEY)
