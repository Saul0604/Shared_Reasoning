from pydantic import BaseModel, Field
from typing import List, Optional

class LogicalPin(BaseModel):
    name: str = Field(description="Nombre lógico del pin, ej. 'anode', 'cathode', 'pin1', 'pin2', 'base', 'collector'")
    connected_to_net: str = Field(description="Nombre de la red o nodo eléctrico al que está conectado, ej. 'Net_1', 'VCC', 'GND'")

class LogicalComponent(BaseModel):
    id: str = Field(description="Identificador único del componente, ej. 'R1', 'U1', 'LED1'")
    type: str = Field(description="Tipo de componente, ej. 'resistor', 'led', 'capacitor', 'diode', 'bjt_npn', 'switch'")
    value: str = Field(description="Valor o especificación técnica, ej. '220 Ohm', 'rojo', '10uF', '2N2222'")
    pins: List[LogicalPin] = Field(description="Lista de pines lógicos del componente y sus conexiones a redes")

class LogicalNet(BaseModel):
    id: str = Field(description="Identificador único del nodo equipotencial/red, ej. 'Net_1', 'VCC', 'GND'")
    name: Optional[str] = Field(None, description="Nombre amigable opcional de la red")

class LogicalNetlist(BaseModel):
    components: List[LogicalComponent] = Field(description="Lista de componentes identificados en el circuito")
    nets: List[LogicalNet] = Field(description="Lista de redes o nodos eléctricos de interconexión")
