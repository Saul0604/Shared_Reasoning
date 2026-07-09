from pydantic import BaseModel

from app.schemas.circuit import Circuit
from app.schemas.assembly_step import AssemblyStep


class Project(BaseModel):
    circuit: Circuit
    assembly_steps: list[AssemblyStep] = []