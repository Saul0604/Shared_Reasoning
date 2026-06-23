from pydantic import BaseModel
from app.schemas.verification import Verification

class VerifyRequest(BaseModel):
    image: str  # Base64 string of the breadboard photo
    step_number: int  # Current step number being built

class VerifyResponse(BaseModel):
    verification: Verification
