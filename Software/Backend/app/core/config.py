# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "gemini")  # "gemini" o "local"
    LOCAL_API_BASE = os.getenv("LOCAL_API_BASE", "http://localhost:11434/v1")  # Endpoint de Ollama, LM Studio, etc.
    LOCAL_MODEL_NAME = os.getenv("LOCAL_MODEL_NAME", "llama3.2-vision")  # Nombre del modelo local (ej: llama3.2-vision, qwen2.5-coder, etc.)

settings = Settings()