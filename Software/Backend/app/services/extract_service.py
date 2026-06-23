from app.schemas.extract import ExtractResponse

from app.schemas.circuit import (
    Circuit,
    Component,
)


class ExtractService:

    def extract(self):

        circuit = Circuit(
            components=[
                Component(
                    id="R1",
                    type="resistor",
                    value="220Ω"
                )
            ]
        )

        return ExtractResponse(
            circuit=circuit
        )