from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from app.schemas.project import Project
from app.services.gemini_service import gemini_service
import json

# Definimos el Estado del Agente
class AgentState(TypedDict):
    base64_image: str
    project: Optional[Project]
    error_message: Optional[str]
    correction_attempts: int

# Nodo 1: Extrae la información básica utilizando visión artificial
def extract_node(state: AgentState) -> AgentState:
    print("\n--- [AGENT LANGGRAPH: EXTRACT NODE START] ---")
    try:
        print("Enviando imagen al servicio de visión...")
        project_data = gemini_service.extract_project_from_image(state["base64_image"])
        project_json = project_data.model_dump_json(indent=2)
        print(f"Extracción exitosa. JSON generado por IA:\n{project_json}")
        return {
            **state,
            "project": project_data,
            "error_message": None
        }
    except Exception as e:
        error_msg = f"Error en la extracción por visión: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            **state,
            "error_message": error_msg
        }
        

# Nodo 2: Valida que no haya cortocircuitos ni colisiones físicas en la protoboard usando reglas en Python
def validate_node(state: AgentState) -> AgentState:
    print("\n--- [AGENT LANGGRAPH: VALIDATE NODE START] ---")
    project = state.get("project")
    if not project or not project.circuit:
        print("Advertencia: No hay un circuito estructurado para validar.")
        return state

    components = project.circuit.components
    connections = project.circuit.connections
    
    print(f"Validando {len(components)} componentes y {len(connections)} conexiones...")

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
                    print(f"❌ Regla de validación violada: {error}")
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
                    print(f"❌ Regla de validación violada: {error}")
                    return {**state, "error_message": error}
                occupied_holes[p1] = comp.id
            
            # Fin
            p2 = (comp.breadboard.row_end, comp.breadboard.col_end)
            if p2[0] not in ['+', '-']:
                if p2 in occupied_holes:
                    error = f"Colisión de pines: El pin del componente '{comp.id}' solapa con '{occupied_holes[p2]}' en la coordenada {p2[0].upper()}{p2[1]}."
                    print(f"❌ Regla de validación violada: {error}")
                    return {**state, "error_message": error}
                occupied_holes[p2] = comp.id

    print("✅ Todas las reglas físicas de validación pasaron de forma exitosa.")
    return {**state, "error_message": None}

# Nodo 3: Pide corrección del circuito si falló la validación
def correction_node(state: AgentState) -> AgentState:
    print(f"\n--- [AGENT LANGGRAPH: CORRECTION NODE START (Intento {state['correction_attempts'] + 1})] ---")
    if state["correction_attempts"] >= 2:
        print("Límite de reintentos alcanzado (máx: 2). Devolviendo estado actual.")
        return state
        
    error = state["error_message"]
    print(f"Enviando reporte de error a la IA para re-calcular coordenadas: '{error}'")
    # Re-escribimos el prompt pidiendo corregir el JSON anterior
    prompt_correction = f"""
El análisis del circuito devolvió un error físico de diseño:
"{error}"

Por favor corrige el JSON del circuito para solucionar este error. Conserva los mismos componentes y la misma topología lógica, pero corrige las coordenadas físicas en 'breadboard'.

Devuelve el JSON del circuito corregido en ESPAÑOL.
"""
    try:
        corrected_project = gemini_service.structured_completion(prompt_correction, Project)
        corrected_json = corrected_project.model_dump_json(indent=2)
        print(f"Corrección recibida con éxito de la IA. JSON corregido:\n{corrected_json}")
        return {
            **state,
            "project": corrected_project,
            "error_message": None,
            "correction_attempts": state["correction_attempts"] + 1
        }
    except Exception as e:
        error_msg = f"Error durante la corrección: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            **state,
            "error_message": error_msg,
            "correction_attempts": state["correction_attempts"] + 1
        }

# Función router condicional para decidir hacia dónde ir desde la validación
def check_validation(state: AgentState):
    print("\n--- [AGENT LANGGRAPH: ROUTING DECISION] ---")
    if state.get("error_message") is not None:
        if state["correction_attempts"] < 2:
            print(f"Circuito posee errores. Redirigiendo a nodo 'correction' (intentos hasta ahora: {state['correction_attempts']}).")
            return "correction"
        else:
            print("Circuito posee errores pero se agotó el cupo de intentos de corrección. Terminando flujo.")
            return "end"
    print("Circuito totalmente correcto. Finalizando ejecución del agente.")
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

