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
        

# Nodo 2: Valida que no haya cortocircuitos ni colisiones físicas en la protoboard usando reglas en Python
def validate_node(state: AgentState) -> AgentState:
    project = state.get("project")
    if not project or not project.circuit:
        return state

    components = project.circuit.components
    connections = project.circuit.connections
    
    # 1. Buscar si hay cortocircuitos en componentes (ambos pines en la misma columna)
    for comp in components:
        if comp.breadboard:
            # Si están en la misma columna (col_start == col_end) y además están en las columnas de la protoboard (no alimentación)
            if (comp.breadboard.col_start == comp.breadboard.col_end 
                and comp.breadboard.row_start in ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
                and comp.breadboard.row_end in ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']):
                
                # Excepción: los pulsadores o componentes de 4 patas sí pueden compartir columnas bajo ciertas topologías,
                # pero para resistencias/LEDs típicos es un cortocircuito.
                if comp.type in ["resistencia", "led", "diodo"]:
                    error = f"Cortocircuito detectado: El componente '{comp.id}' ({comp.type}) tiene ambos pines en la columna {comp.breadboard.col_start}."
                    return {**state, "error_message": error}

    # 2. Buscar si hay solapamiento físico en el mismo agujero de la protoboard
    occupied_holes = {}
    for comp in components:
        if comp.breadboard:
            # Origen
            p1 = (comp.breadboard.row_start, comp.breadboard.col_start)
            if p1[0] not in ['+', '-']: # Omitir rieles de energía porque ahí sí van varios cables
                if p1 in occupied_holes:
                    error = f"Colisión de pines: El pin del componente '{comp.id}' solapa con '{occupied_holes[p1]}' en la coordenada {p1[0].upper()}{p1[1]}."
                    return {**state, "error_message": error}
                occupied_holes[p1] = comp.id
            
            # Fin
            p2 = (comp.breadboard.row_end, comp.breadboard.col_end)
            if p2[0] not in ['+', '-']:
                if p2 in occupied_holes:
                    error = f"Colisión de pines: El pin del componente '{comp.id}' solapa con '{occupied_holes[p2]}' en la coordenada {p2[0].upper()}{p2[1]}."
                    return {**state, "error_message": error}
                occupied_holes[p2] = comp.id

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
