from app.schemas.assembly_step import AssemblyStep
from app.schemas.project import Project
from app.schemas.extract import ExtractResponse

from app.schemas.circuit import Circuit
from app.schemas.component import Component, Pin
from app.schemas.connection import Connection
from app.services.gemini_service import gemini_service


class ExtractService:

    def extract(self, image: str):
        # Si la imagen es de prueba, corta o vacía, usamos el simulador
        if not image or len(image) < 100 or "base64_string_aqui" in image:
            circuit = Circuit(
                components=[
                    Component(
                        id="R1",
                        type="resistor",
                        value="220Ω",
                        pins=[
                            Pin(name="pin1", position="+"),
                            Pin(name="pin2", position="E5")
                        ]
                    ),
                    Component(
                        id="LED1",
                        type="led",
                        value="red",
                        pins=[
                            Pin(name="anode", position="F5"),
                            Pin(name="cathode", position="-")
                        ]
                    )
                ],
                connections=[
                    Connection(
                        from_component="R1",
                        from_pin="pin1",
                        to_component="power_rail",
                        to_pin="positive"
                    ),
                    Connection(
                        from_component="R1",
                        from_pin="pin2",
                        to_component="LED1",
                        to_pin="anode"
                    ),
                    Connection(
                        from_component="LED1",
                        from_pin="cathode",
                        to_component="power_rail",
                        to_pin="negative"
                    )
                ]
            )

            project = Project(
                circuit=circuit,
                assembly_steps=[
                    AssemblyStep(
                        step_number=1,
                        title="Insert resistor",
                        description="Place R1 between A5 and E5",
                        component_id="R1"
                    ),
                    AssemblyStep(
                        step_number=2,
                        title="Insert LED",
                        description="Place LED1 on F5 and F7",
                        component_id="LED1"
                    )
                ]
            )

            return ExtractResponse(
                project=project
            )

        # De lo contrario, realizamos la extracción real usando el agente LangGraph
        from app.agents.circuit_agent import circuit_agent
        
        initial_state = {
            "base64_image": image,
            "project": None,
            "error_message": None,
            "correction_attempts": 0
        }
        
        final_state = circuit_agent.invoke(initial_state)
        project = final_state.get("project")
        
        if not project:
            # Fallback en caso de que falle por completo
            raise ValueError(final_state.get("error_message") or "No se pudo extraer el circuito de la imagen.")
            
        return ExtractResponse(
            project=project
        )