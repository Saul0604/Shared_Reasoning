from pydantic import BaseModel


class Connection(BaseModel):
    from_component: str
    from_pin: str

    to_component: str
    to_pin: str