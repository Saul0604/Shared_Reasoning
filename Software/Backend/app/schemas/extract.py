from pydantic import BaseModel

from app.schemas.circuit import Circuit


class ExtractRequest(BaseModel):
    image: str


class ExtractResponse(BaseModel):
    circuit: Circuit