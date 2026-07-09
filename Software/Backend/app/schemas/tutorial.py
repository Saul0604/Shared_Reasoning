from pydantic import BaseModel, Field
from typing import List

class ComponentTutorial(BaseModel):
    summary: str = Field(description="Una breve explicación (1-2 oraciones) de qué es el componente.")
    how_it_works: str = Field(description="Explicación en palabras sencillas de cómo funciona internamente o cómo altera la corriente/voltaje.")
    common_uses: List[str] = Field(description="3 ejemplos de usos muy comunes de este componente.")
    connection_tips: str = Field(description="Consejos sobre cómo conectarlo (ej. polaridad, uso con protoboard, resistencias necesarias).")
