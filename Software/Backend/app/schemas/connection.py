from pydantic import BaseModel
from typing import Optional


class ConnectionBreadboard(BaseModel):
    from_row: str
    from_col: int
    to_row: str
    to_col: int


class Connection(BaseModel):
    from_component: str
    from_pin: str

    to_component: str
    to_pin: str

    wire_color: Optional[str] = None
    breadboard: Optional[ConnectionBreadboard] = None