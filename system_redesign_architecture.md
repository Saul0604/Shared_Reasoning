# Propuesta de Rediseño de Arquitectura: Shared Reasoning (Elektra)

## 1. Problemas de la Arquitectura Actual

El diseño inicial del sistema posee un acoplamiento crítico entre la **interpretación de la imagen** y el **layout físico en la protoboard**. Al exigir que un modelo de lenguaje visual (VLM) genere directamente coordenadas físicas discretas (filas y columnas de la protoboard), el sistema hereda los siguientes problemas:

* **Inexistencia de información espacial en diagramas**: Un diagrama esquemático representa exclusivamente interconexiones eléctricas abstractas (topología). No contiene coordenadas físicas de protoboard. Por ende, la IA está forzada a inventar (alucinar) una distribución física de la nada.
* **Falta de precisión espacial en VLMs**: Los VLMs no son calculadoras geométricas. A menudo confunden filas adyacentes (ej. confunden `'b'` con `'c'`) o generan pines solapados en el mismo hueco de la placa de forma aleatoria.
* **Inviabilidad de validación en tiempo de generación**: El modelo no puede validar dinámicamente si la topología propuesta respeta las reglas de diseño eléctrico (DRC - Design Rule Check), lo que genera cortocircuitos indetectables hasta que el cliente dibuja el canvas.
* **Inflexibilidad del modelo de datos**: El esquema basado en conexiones directas de pin a pin (`Connection`) escala exponencialmente en complejidad y no representa cómo operan los simuladores o programas CAD reales de electrónica.

---

## 2. Arquitectura Propuesta

La nueva arquitectura separa completamente el procesamiento en tres capas bien definidas:

```
+-----------------------------------------------------------------------+
| 1. CAPA DE PERCEPCIÓN (IA Multimodal)                                 |
|    - Entrada: Imagen (Foto / Esquemático)                             |
|    - Proceso: El LLM detecta símbolos, componentes y conexiones.      |
|    - Salida: Netlist Lógica (Grafo del Circuito)                      |
+------------------------------------+----------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------+
| 2. CAPA DE MODELADO LÓGICO (Grafo de Circuitos - CircuitGraph)         |
|    - Estructura: Grafo bipartito de Componentes y Nets (Redes).       |
|    - Proceso: Análisis topológico, reglas eléctricas (DRC).           |
+------------------------------------+----------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------+
| 3. CAPA DE LAYOUT FÍSICO (Algoritmo de Ruteo Automático)              |
|    - Proceso: Colocación (Placement) y Enrutamiento (Routing).        |
|    - Salida: Coordenadas discretas optimizadas de Protoboard.         |
+------------------------------------+----------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------+
| 4. CAPA DE RENDERIZADO (Frontend Canvas)                              |
|    - Proceso: Pintar componentes y cables curvados en Konva JS.        |
+-----------------------------------------------------------------------+
```

---

## 3. Nuevo Flujo del Sistema

```
Usuario carga Imagen
      │
      ▼
[Llamada 1 a LLM: Extracción de Netlist Lógica]
      │  Retorna Componentes (IDs, tipos, valores, lista de pines)
      │  y Nets (Nodos equipotenciales que unen pines).
      ▼
[Construcción del Grafo de Circuito en Python]
      │  Valida integridad (ej. que no falten pines críticos).
      ▼
[Algoritmo de Colocación (Placement)]
      │  1. ICs / Microcontroladores se sitúan cruzando el canal central.
      │  2. Componentes de dos patas se ubican en columnas libres asociadas.
      │  3. Se calculan las rotaciones y distancias mínimas para evitar colisiones.
      ▼
[Algoritmo de Enrutamiento (Routing)]
      │  1. Se identifican conexiones verticales gratuitas (misma columna).
      │  2. Se trazan jumpers físicos para unir columnas distintas usando A* modificado.
      ▼
[Generación de Instrucciones de Ensamblaje]
      │  Un LLM de texto puro genera los pasos en español basados en el layout físico real.
      ▼
[Renderizado final en Frontend]
```

---

## 4. Nuevo Modelo de Datos (Schemas Pydantic)

Reemplazamos la representación primitiva de conexiones por un sistema basado en **Nets (Nodos de Conexión)** y **Pines Lógicos**, emulando el estándar industrial de archivos SPICE y KiCad:

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class LogicalPin(BaseModel):
    name: str = Field(description="Nombre lógico del pin, ej. 'anode', 'cathode', 'base', 'pin1'")
    connected_to_net: str = Field(description="Nombre de la red o nodo eléctrico al que está conectado, ej. 'Net_1', 'VCC', 'GND'")

class LogicalComponent(BaseModel):
    id: str = Field(description="Identificador único del componente, ej. 'R1', 'U1', 'LED1'")
    type: str = Field(description="Tipo de componente, ej. 'resistor', 'led', 'bjt_npn', 'dip_ic', 'arduino_nano'")
    value: str = Field(description="Valor o especificación técnica, ej. '220 Ohm', 'rojo', '2N2222', 'NE555'")
    pins: List[LogicalPin] = Field(description="Lista de pines lógicos del componente y sus conexiones a redes")

class LogicalNet(BaseModel):
    id: str = Field(description="Identificador único del nodo equipotencial, ej. 'Net_1', 'VCC', 'GND'")
    name: Optional[str] = Field(None, description="Nombre amigable opcional")

class LogicalNetlist(BaseModel):
    components: List[LogicalComponent]
    nets: List[LogicalNet]

class CircuitGraphResponse(BaseModel):
    netlist: LogicalNetlist
```

### Atributos Clave:
* **`nets`**: En lugar de definir cables individuales, agrupamos los pines que comparten el mismo nodo de tensión.
* **`pins` en `LogicalComponent`**: Cada componente declara explícitamente a qué red se conecta cada uno de sus terminales lógicos.

---

## 5. Diseño del Algoritmo de Autolayout

El algoritmo en el backend se encarga de posicionar los componentes y trazar los cables de conexión sin intervención del LLM:

### 1. Colocación (Placement)
* **Entidades complejas (Chips DIP / Microcontroladores)**: Se posicionan automáticamente a lo largo de la hendidura o canal central de la protoboard (entre las filas `e` y `f`), con sus pines superiores alineados en las filas `'a'-'e'` y los inferiores en `'f'-'j'`.
* **Componentes de dos terminales (Resistencias, Diodos, LEDs)**:
  * El algoritmo analiza las columnas donde están anclados los nodos a los que se conecta.
  * Selecciona el camino más corto posible, orientándolos de manera preferente horizontalmente.
  * Valida colisiones: mantiene un registro de ocupación (`grid[row][col] = component_id`). Si un agujero ya está ocupado, desplaza el nuevo pin al orificio libre más cercano de la misma columna vertical (que mantiene la misma conexión eléctrica).

### 2. Enrutamiento (Routing)
* **Pistas Internas**: El algoritmo conoce que las columnas verticales `'a'-'e'` y `'f'-'j'` están conectadas internamente por pistas metálicas. Por ende, dos terminales conectados a la misma columna y sección no requieren cable físico.
* **Trazado de Jumpers**: Si dos pines en la misma red (`Net`) están en columnas o secciones diferentes, el algoritmo utiliza el **Algoritmo de Lee** (Wavefront expansion) o un buscador **A*** sobre el grafo de agujeros de la protoboard para trazar el cable de interconexión con el menor número de cruces y la menor distancia física posible.

---

## 6. Migración desde el Sistema Actual

La migración se puede realizar de manera incremental sin romper la interfaz gráfica actual:

1. **Mantener compatibilidad en el Frontend**: El backend seguirá respondiendo con la estructura anterior de `Project` (con componentes y conexiones que tienen coordenadas físicas calculadas).
2. **Cálculo en Backend**: En lugar de que el LLM genere esas coordenadas físicas en el JSON original, el backend:
   * Recibe la Netlist lógica de la IA.
   * Ejecuta el algoritmo de autolayout en Python.
   * Transforma el resultado del autolayout a la estructura vieja (`Project`) poblando los campos de `breadboard` en los componentes y conexiones.
3. El frontend renderizará la placa Konva de forma idéntica, pero con coordenadas 100% lógicas y libres de errores geométricos.

---

## 7. Ventajas, Desventajas y Riesgos

### Ventajas:
* **Precisión Absoluta**: Se eliminan por completo las alucinaciones de coordenadas físicas de la IA.
* **Escalabilidad**: Soporta circuitos complejos, circuitos integrados de muchos pines, Arduino o ESP32 aplicando reglas matemáticas deterministas de posicionamiento.
* **Compatibilidad CAD**: Facilita la exportación a formatos estándar como SPICE o KiCad directamente desde el backend.

### Desventajas:
* **Complejidad algorítmica**: Desarrollar un motor de placement & routing robusto para protoboards requiere tiempo de ingeniería y algoritmos de optimización espacial.

### Riesgos:
* **Casos de esquina (Edge Cases)**: Circuitos con densidades extremas de componentes pueden quedarse sin espacio de enrutamiento en una sola protoboard, requiriendo algoritmos de particionamiento avanzados o soporte para múltiples protoboards virtuales.
