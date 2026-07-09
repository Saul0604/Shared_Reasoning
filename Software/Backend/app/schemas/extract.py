from pydantic import BaseModel

from app.schemas.circuit import Circuit
from app.schemas.project import Project

class ExtractRequest(BaseModel):
    image: str


class ExtractResponse(BaseModel):
   project: Project