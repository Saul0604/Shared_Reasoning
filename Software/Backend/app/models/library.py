from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class LibraryMaterial(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    category: str  # "Libros" | "PDFs" | "Guías" | "Datasheets"
    difficulty: str  # "Principiante" | "Intermedio" | "Avanzado" | "Referencia"
    file_path: str   # Ruta al archivo guardado en el servidor
    cover_image_url: Optional[str] = None  # Portada o icono (opcional)
    progress: int = Field(default=0)  # Progreso estimado de lectura (0 a 100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
