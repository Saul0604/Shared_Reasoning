
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from app.schemas.project import Project
from app.services.openai_service import openai_service
import json

# Definimos el Estado del Agente
class AgentState(TypedDict):
    base64_image: str
    project: Optional[Project]
    error_message: Optional[str]
    correction_attempts: int

# Nodo 1: Extrae la información básica utilizando visión artificial
def extract_node(state: AgentState) -> AgentState:
    try:
        project_data = openai_service.extract_project_from_image(state["base64_image"])
        return {
            **state,
            "project": project_data,
            "error_message": None
        }
    except Exception as e:
        return {
            **state,
            "error_message": f"Error en la extracción por visión: {str(e)}"
        }

# Nodo 2: Valida la consistencia físico-lógica y la coherencia del circuito en la protoboard
def validate_node(state: AgentState) -> AgentState:
    project = state.get("project")
    if not project or not project.circuit:
        return state

    components = project.circuit.components
    connections = project.circuit.connections
    
    # -------------------------------------------------------------
    # 1. Validación de Cortocircuitos Físicos
    # -------------------------------------------------------------
    for comp in components:
        if comp.breadboard:
            # Si ambos pines del componente están en la misma columna y no son rieles de alimentación
            if (comp.breadboard.col_start == comp.breadboard.col_end 
                and comp.breadboard.row_start in ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
                and comp.breadboard.row_end in ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']):
                
                # Para componentes básicos de dos terminales (como resistencias y LEDs)
                if comp.type in ["resistencia", "led", "diodo"]:
                    error = f"Cortocircuito físico: El componente '{comp.id}' ({comp.type}) está cortocircuitado porque ambos pines están colocados en la columna {comp.breadboard.col_start}."
                    return {**state, "error_message": error}

    # -------------------------------------------------------------
    # 2. Validación de Colisiones (pines sobrepuestos en el mismo agujero)
    # -------------------------------------------------------------
    occupied_holes = {}
    for comp in components:
        if comp.breadboard:
            # Pin de inicio
            p1 = (comp.breadboard.row_start, comp.breadboard.col_start)
            if p1[0] not in ['+', '-']:  # Omitir rieles de energía
                if p1 in occupied_holes:
                    error = f"Colisión de pines: El componente '{comp.id}' comparte el mismo orificio {p1[0].upper()}{p1[1]} con '{occupied_holes[p1]}'."
                    return {**state, "error_message": error}
                occupied_holes[p1] = comp.id
            
            # Pin de fin
            p2 = (comp.breadboard.row_end, comp.breadboard.col_end)
            if p2[0] not in ['+', '-']:
                if p2 in occupied_holes:
                    error = f"Colisión de pines: El componente '{comp.id}' comparte el mismo orificio {p2[0].upper()}{p2[1]} con '{occupied_holes[p2]}'."
                    return {**state, "error_message": error}
                occupied_holes[p2] = comp.id

    # -------------------------------------------------------------
    # 3. Validación de Coherencia Físico-Lógica (Cables vs Coordenadas)
    # -------------------------------------------------------------
    # Mapeo rápido de componentes a sus coordenadas
    comp_coords = {}
    for comp in components:
        if comp.breadboard:
            comp_coords[comp.id] = {
                # Mapear pines lógicos a sus respectivas posiciones físicas
                # Asumimos que el primer pin es el de inicio y el segundo es el de fin
                "pin1": (comp.breadboard.row_start, comp.breadboard.col_start),
                "pasivo": (comp.breadboard.row_start, comp.breadboard.col_start),
                "anode": (comp.breadboard.row_start, comp.breadboard.col_start),
                "positive": (comp.breadboard.row_start, comp.breadboard.col_start),
                "pin2": (comp.breadboard.row_end, comp.breadboard.col_end),
                "cathode": (comp.breadboard.row_end, comp.breadboard.col_end),
                "negative": (comp.breadboard.row_end, comp.breadboard.col_end)
            }

    for conn in connections:
        # Omitir conexiones a las líneas de alimentación si no tienen detalles de coordenadas
        if conn.from_component == "power_rail" or conn.to_component == "power_rail":
            continue

        # Si la conexión lógica tiene asignado un cable físico con coordenadas en la protoboard
        if conn.breadboard:
            from_col = conn.breadboard.from_col
            from_row = conn.breadboard.from_row
            to_col = conn.breadboard.to_col
            to_row = conn.breadboard.to_row

            # Verificar que el origen del cable conecte a la columna correcta del componente origen
            if conn.from_component in comp_coords:
                coords = comp_coords[conn.from_component]
                # Buscar si algún pin del componente origen coincide con la columna del cable (from_col)
                # En protoboard, la conexión es por columna común
                pin_cols = [c[1] for p, c in coords.items() if c]
                if from_col not in pin_cols:
                    error = (
                        f"Inconsistencia de cable: Declaras un cable desde el componente '{conn.from_component}' "
                        f"en la columna {from_col}, pero físicamente el componente '{conn.from_component}' "
                        f"no tiene ningún pin en esa columna (sus pines están en: {pin_cols})."
                    )
                    return {**state, "error_message": error}

            # Verificar que el destino del cable conecte a la columna correcta del componente destino
            if conn.to_component in comp_coords:
                coords = comp_coords[conn.to_component]
                pin_cols = [c[1] for p, c in coords.items() if c]
                if to_col not in pin_cols:
                    error = (
                        f"Inconsistencia de cable: Declaras un cable hacia el componente '{conn.to_component}' "
                        f"en la columna {to_col}, pero físicamente el componente '{conn.to_component}' "
                        f"no tiene ningún pin en esa columna (sus pines están en: {pin_cols})."
                    )
                    return {**state, "error_message": error}

    # -------------------------------------------------------------
    # 4. Validación de Continuidad Eléctrica (Camino Cerrado de Batería)
    # -------------------------------------------------------------
    # Construimos un grafo de conexiones lógicas
    adj = {}
    for comp in components:
        adj[comp.id] = []
    
    # Rieles de alimentación como nodos virtuales
    adj["positive_rail"] = []
    adj["negative_rail"] = []

    for conn in connections:
        u = conn.from_component
        v = conn.to_component
        if u == "power_rail":
            u = "positive_rail" if conn.from_pin == "positive" else "negative_rail"
        if v == "power_rail":
            v = "positive_rail" if conn.to_pin == "positive" else "negative_rail"
            
        if u in adj and v in adj:
            adj[u].append(v)
            adj[v].append(u) # Bidireccional para simular conducción física

    # Buscar si hay un camino desde 'positive_rail' (o la batería positiva) hasta 'negative_rail' (o la batería negativa)
    start_node = "positive_rail"
    end_node = "negative_rail"
    
    # Si no hay rieles virtuales, buscar por componente batería directo
    baterias = [comp.id for comp in components if comp.type in ["bateria", "fuente"]]
    if baterias:
        if start_node not in adj or not adj[start_node]:
            start_node = baterias[0]
        if end_node not in adj or not adj[end_node]:
            end_node = baterias[0]

    # Ejecutar DFS básico
    visited = set()
    def dfs(node):
        visited.add(node)
        if node == end_node:
            return True
        for neighbor in adj.get(node, []):
            if neighbor not in visited:
                if dfs(neighbor):
                    return True
        return False

    has_loop = False
    if start_node in adj:
        has_loop = dfs(start_node)

    if not has_loop and len(components) > 1:
        # Advertir a la IA si no cerró el circuito
        error = "Circuito abierto detectado: No existe continuidad eléctrica que conecte el polo positivo de la alimentación con el polo negativo a través de los componentes."
        return {**state, "error_message": error}

    return {**state, "error_message": None}


# Nodo 3: Pide corrección del circuito si falló la validación
def correction_node(state: AgentState) -> AgentState:
    if state["correction_attempts"] >= 2:
        # Límite de intentos alcanzado, no seguimos pidiendo re-intentos
        return state
        
    error = state["error_message"]
    # Re-escribimos el prompt pidiendo corregir el JSON anterior
    prompt_correction = f"""
El análisis del circuito devolvió un error físico de diseño:
"{error}"

Por favor corrige el JSON del circuito para solucionar este error. Conserva los mismos componentes y la misma topología lógica, pero corrige las coordenadas físicas en 'breadboard'.

Devuelve el JSON del circuito corregido en ESPAÑOL.
"""
    try:
        response = openai_service.client.beta.chat.completions.parse(
            model=openai_service.model_name,
            messages=[
                {
                    "role": "user",
                    "content": prompt_correction
                }
            ],
            response_format=Project
        )
        corrected_project = response.choices[0].message.parsed
        return {
            **state,
            "project": corrected_project,
            "error_message": None,
            "correction_attempts": state["correction_attempts"] + 1
        }
    except Exception as e:
        return {
            **state,
            "error_message": f"Error durante la corrección: {str(e)}",
            "correction_attempts": state["correction_attempts"] + 1
        }

# Función router condicional para decidir hacia dónde ir desde la validación
def check_validation(state: AgentState):
    if state.get("error_message") is not None:
        if state["correction_attempts"] < 2:
            return "correction"
        else:
            return "end"
    return "end"

# Construcción del grafo de LangGraph
workflow = StateGraph(AgentState)

# Agregar nodos
workflow.add_node("extractor", extract_node)
workflow.add_node("validator", validate_node)
workflow.add_node("correction", correction_node)

# Establecer conexiones
workflow.set_entry_point("extractor")
workflow.add_edge("extractor", "validator")

# Enrutamiento condicional desde validator
workflow.add_conditional_edges(
    "validator",
    check_validation,
    {
        "correction": "correction",
        "end": END
    }
)

# Conectar el nodo de corrección de vuelta a validación para verificar el nuevo resultado
workflow.add_edge("correction", "validator")

# Compilar grafo
circuit_agent = workflow.compile()
