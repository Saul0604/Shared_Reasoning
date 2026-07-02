# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "openai")  # "openai" o "local"
    LOCAL_API_BASE = os.getenv("LOCAL_API_BASE", "http://localhost:11434/v1")  # Endpoint de Ollama, LM Studio, etc.
    LOCAL_MODEL_NAME = os.getenv("LOCAL_MODEL_NAME", "llama3.2-vision")  # Nombre del modelo local (ej: llama3.2-vision, qwen2.5-coder, etc.)

    # Configuración de Base de Datos
    # Por defecto crea un archivo local SQLite (sqlite:///./database.db)
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

    # Configuración de JWT Security
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-shared-reasoning-2026")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 1 día por defecto


settings = Settings()