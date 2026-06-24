from pydantic import BaseModel
from typing import Optional


class Pin(BaseModel):
    name: str
    position: str


class ComponentBreadboard(BaseModel):
    row_start: str  # e.g., 'e', '+', '-'
    col_start: int  # e.g., 5
    row_end: str    # e.g., 'e', '+', '-'
    col_end: int    # e.g., 8


class Component(BaseModel):
    id: str
    type: str
    value: str
    pins: list[Pin]
    breadboard: Optional[ComponentBreadboard] = None