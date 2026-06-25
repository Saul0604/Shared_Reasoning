from pydantic import BaseModel


class AssemblyStep(BaseModel):
    step_number: int
    title: str
    description: str
    component_id: str