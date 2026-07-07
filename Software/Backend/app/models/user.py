from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from sqlalchemy import Column
from sqlalchemy.dialects.mysql import LONGTEXT

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: Optional[str] = None
    is_active: bool = Field(default=True)
    profile_picture_base64: Optional[str] = Field(default=None, sa_column=Column(LONGTEXT))

# Modelo que se guarda en la base de datos (contiene la contraseña hasheada)
class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Esquemas de entrada y salida para el API
class UserCreate(SQLModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserRead(UserBase):
    id: int
    created_at: datetime

class Token(SQLModel):
    access_token: str
    token_type: str
