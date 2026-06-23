from pydantic import BaseModel


class Component(BaseModel):
    id: str
    type: str
    value: str

from typing import List


class Circuit(BaseModel):
    components: List[Component]