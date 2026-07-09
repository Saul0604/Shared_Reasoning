from pydantic import BaseModel, model_validator

from app.schemas.component import Component
from app.schemas.connection import Connection


class Circuit(BaseModel):
    components: list[Component] = []
    connections: list[Connection] = []

    @model_validator(mode="after")
    def validate_circuit(self):

        component_map = {
            component.id: component
            for component in self.components
        }

        used_components = set()

        for connection in self.connections:

            # Verificar que el componente origen exista
            if (
                connection.from_component != "power_rail"
                and connection.from_component not in component_map
            ):
                raise ValueError(
                    f"Componente inexistente: {connection.from_component}"
                )

            # Verificar que el componente destino exista
            if (
                connection.to_component != "power_rail"
                and connection.to_component not in component_map
            ):
                raise ValueError(
                    f"Componente inexistente: {connection.to_component}"
                )

            # Registrar componentes utilizados
            if connection.from_component != "power_rail":
                used_components.add(connection.from_component)

            if connection.to_component != "power_rail":
                used_components.add(connection.to_component)

            # Validar pin origen
            if connection.from_component != "power_rail":
                valid_pins = {
                    pin.name
                    for pin in component_map[connection.from_component].pins
                }

                if connection.from_pin not in valid_pins:
                    raise ValueError(
                        f"Pin inválido '{connection.from_pin}' "
                        f"en componente '{connection.from_component}'"
                    )

            # Validar pin destino
            if connection.to_component != "power_rail":
                valid_pins = {
                    pin.name
                    for pin in component_map[connection.to_component].pins
                }

                if connection.to_pin not in valid_pins:
                    raise ValueError(
                        f"Pin inválido '{connection.to_pin}' "
                        f"en componente '{connection.to_component}'"
                    )

        # NOTA: La validación de "componentes huérfanos" fue removida porque en la
        # arquitectura de layout horizontal, muchas conexiones son implícitas
        # (pines que comparten columna se conectan vía bus strip interno de la protoboard)
        # y no generan entradas explícitas en la lista de Connection.

        return self