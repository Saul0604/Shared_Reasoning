from pydantic import BaseModel
from typing import Optional

class ComponentVerification(BaseModel):
    component_id: str
    status: str  # "correct", "incorrect", "missing"
    detected_pins: Optional[list[str]] = None
    error_message: Optional[str] = None

class Verification(BaseModel):
    is_correct: bool
    message: str
    components: list[ComponentVerification] = []
