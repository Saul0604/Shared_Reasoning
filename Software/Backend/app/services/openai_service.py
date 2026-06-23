# pyrefly: ignore [missing-import]
from openai import OpenAI

from app.core.config import settings


class OpenAIService:

    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY
        )


openai_service = OpenAIService()