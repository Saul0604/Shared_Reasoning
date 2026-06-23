from pydantic import BaseModel

from app.schemas.component import Component
from app.schemas.connection import Connection


class Circuit(BaseModel):
    components: list[Component] = []
    connections: list[Connection] = []