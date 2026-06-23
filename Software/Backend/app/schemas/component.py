from pydantic import BaseModel


class Pin(BaseModel):
    name: str
    position: str


class Component(BaseModel):
    id: str
    type: str
    value: str
    pins: list[Pin]