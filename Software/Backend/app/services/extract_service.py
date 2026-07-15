from app.schemas.assembly_step import AssemblyStep
from app.schemas.project import Project
from app.schemas.extract import ExtractResponse

from app.schemas.circuit import Circuit
from app.schemas.component import Component, Pin
from app.schemas.connection import Connection
from app.services.gemini_service import get_ai_service


class ExtractService:

    def extract(self, image: str, provider: str = None, skill_level: str = "Principiante"):
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

        # De lo contrario, realizamos la extracción lógica y calculamos el layout físico de forma determinista
        from app.services.auto_layout_service import auto_layout_service
        import json
        
        try:
            # 1. Extraemos la Netlist lógica de la IA
            ai_service = get_ai_service(provider)
            logical_netlist = ai_service.extract_logical_netlist_from_image(image)
            
            # DEBUG: Imprimir la netlist lógica que devolvió la IA
            print("\n" + "="*60)
            print("NETLIST LOGICA RECIBIDA DE LA IA:")
            print("="*60)
            print(json.dumps(logical_netlist.model_dump(), indent=2, default=str))
            print("="*60 + "\n")
            
            # 2. Generamos el layout físico en la protoboard de manera determinista mediante algoritmos matemáticos
            project = auto_layout_service.generate_layout(logical_netlist, skill_level=skill_level)

            # DEBUG: Imprimir el project resultante
            print("\n" + "="*60)
            print("PROJECT GENERADO (layout físico):")
            print("="*60)
            print(json.dumps(project.model_dump(), indent=2, default=str))
            print("="*60 + "\n")
            
            return ExtractResponse(
                project=project
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise ValueError(f"Falla durante la extracción y colocación del circuito: {str(e)}")