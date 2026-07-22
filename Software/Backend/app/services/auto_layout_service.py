from collections import defaultdict
from app.schemas.logical_netlist import LogicalNetlist, LogicalComponent
from app.schemas.project import Project
from app.schemas.circuit import Circuit
from app.schemas.component import Component, ComponentBreadboard, Pin
from app.schemas.connection import Connection, ConnectionBreadboard
from app.schemas.assembly_step import AssemblyStep
from typing import Dict, List, Tuple, Optional, Set


class AutoLayoutService:
    """
    Servicio de Autolayout determinista para protoboard.

    Principios clave de diseño:
    ─────────────────────────────────────────────────────────────────
    1. COMPONENTES HORIZONTALES: Cada pin de un componente de 2 terminales
       se coloca en una COLUMNA DIFERENTE del MISMO ROW (fila).
       Esto evita el cortocircuito que ocurre cuando ambos pines están
       en la misma columna (filas a-e comparten bus strip interno).

    2. NETS = COLUMNAS COMPARTIDAS: Cuando dos pines pertenecen a la misma
       red eléctrica (net), se colocan en la MISMA COLUMNA. El bus strip
       de la protoboard (filas a-e) los conecta internamente sin necesidad
       de cable.

    3. CABLES SOLO CUANDO SON NECESARIOS: Los jumpers se generan únicamente
       para conexiones a rieles de alimentación (+/-) y para nets que no
       pudieron compartir una columna.

    4. DFS TOPOLÓGICO: Los componentes se colocan siguiendo cadenas desde
       VCC hasta GND, asegurando que la topología del circuito se respeta
       en la disposición física.
    ─────────────────────────────────────────────────────────────────
    """

    # Valores por defecto cuando la IA devuelve "null" o valor vacío
    DEFAULT_VALUES = {
        "resistor": "220Ω",
        "led": "LED",
        "battery": "9V",
        "bateria": "9V",
        "capacitor": "100μF",
        "diode": "1N4148",
        "transistor": "2N2222",
        "switch": "Switch",
        "potentiometer": "10kΩ",
    }

    # Filas disponibles para colocar componentes (sección superior a-e del bus strip)
    COMPONENT_ROWS = ['a', 'b', 'c', 'd', 'e']
    # Separación entre los dos pines de un componente (en columnas)
    PIN_SPACING = 3
    # Separación entre redes de señal distintas (gap compacto entre columnas)
    NET_SPACING = 1
    # Gap extra entre cadenas de componentes independientes
    CHAIN_GAP = 1

    def _fix_value(self, comp_type: str, value: str) -> str:
        """Reemplaza valores nulos o vacíos con defaults sensatos según el tipo."""
        if not value or str(value).lower() in ["null", "none", "unknown", ""]:
            return self.DEFAULT_VALUES.get(comp_type.lower(), comp_type.capitalize())
        return value

    def generate_layout(self, netlist: LogicalNetlist, skill_level: str = "Principiante") -> Project:
        # ═══════════════════════════════════════════════════════════
        # PASO 0: CONSTRUIR ESTRUCTURAS DE DATOS
        # ═══════════════════════════════════════════════════════════
        net_to_pins: Dict[str, List[Tuple[str, str]]] = defaultdict(list)
        comp_map: Dict[str, LogicalComponent] = {}

        for comp in netlist.components:
            comp_map[comp.id] = comp
            for pin in comp.pins:
                net_to_pins[pin.connected_to_net].append((comp.id, pin.name))

        # ═══════════════════════════════════════════════════════════
        # PASO 1: IDENTIFICAR REDES DE ALIMENTACIÓN
        # ═══════════════════════════════════════════════════════════
        battery: Optional[LogicalComponent] = None
        vcc_net: Optional[str] = None
        gnd_net: Optional[str] = None

        for comp in netlist.components:
            if comp.type.lower() in ["battery", "bateria", "power_supply", "fuente", "voltage_source", "voltage"]:
                battery = comp
                for pin in comp.pins:
                    if pin.name.lower() in ["positive", "pos", "vcc", "+", "plus"]:
                        vcc_net = pin.connected_to_net
                    else:
                        gnd_net = pin.connected_to_net
                break

        # ═══════════════════════════════════════════════════════════
        # PASO 2: COLOCAR BATERÍA EN RIELES DE ALIMENTACIÓN
        # ═══════════════════════════════════════════════════════════
        pin_physical: Dict[str, Tuple[str, int]] = {}  # "comp.pin" -> (row, col)
        placed_components: List[Component] = []
        placed_ids: Set[str] = set()
        bat_col = 2

        if battery:
            pin1_name = battery.pins[0].name
            pin2_name = battery.pins[1].name
            pin_physical[f"{battery.id}.{pin1_name}"] = ("+", bat_col)
            pin_physical[f"{battery.id}.{pin2_name}"] = ("-", bat_col)

            placed_components.append(Component(
                id=battery.id,
                type=battery.type,
                value=self._fix_value(battery.type, battery.value),
                pins=[
                    Pin(name=pin1_name, position=f"+{bat_col}"),
                    Pin(name=pin2_name, position=f"-{bat_col}")
                ],
                breadboard=ComponentBreadboard(
                    row_start="+", col_start=bat_col,
                    row_end="-", col_end=bat_col
                )
            ))
            placed_ids.add(battery.id)

        # ═══════════════════════════════════════════════════════════
        # PASO 3: COLOCACIÓN TOPOLÓGICA (DFS por cadenas)
        #
        # Estrategia: Cada net de señal recibe UNA columna.
        # Todos los pines en esa net comparten la columna.
        # El bus strip interno (filas a-e) los conecta sin cable.
        # ═══════════════════════════════════════════════════════════
        net_column: Dict[str, int] = {}    # net de señal → columna asignada
        col_cursor = 1                      # Columna inicial (empezar desde columna 1)
        row_at_col: Dict[int, int] = defaultdict(int)  # col → índice del siguiente row

        # Encontrar componentes iniciales (conectados a VCC)
        start_comps: List[str] = []
        if vcc_net:
            for comp_id, _ in net_to_pins.get(vcc_net, []):
                if comp_id not in placed_ids:
                    start_comps.append(comp_id)

        # Fallback: componentes conectados a GND
        if not start_comps and gnd_net:
            for comp_id, _ in net_to_pins.get(gnd_net, []):
                if comp_id not in placed_ids:
                    start_comps.append(comp_id)

        # Fallback final: todos los restantes
        if not start_comps:
            for comp in netlist.components:
                if comp.id not in placed_ids:
                    start_comps.append(comp.id)

        def place_chain(start_id: str):
            """
            Coloca una cadena de componentes siguiendo las nets de señal
            mediante DFS. Cada componente se coloca horizontalmente.
            """
            nonlocal col_cursor
            stack = [start_id]

            while stack:
                comp_id = stack.pop()
                if comp_id in placed_ids:
                    continue
                placed_ids.add(comp_id)

                comp = comp_map[comp_id]
                if len(comp.pins) < 2:
                    continue

                pin1, pin2 = comp.pins[0], comp.pins[1]
                net1, net2 = pin1.connected_to_net, pin2.connected_to_net
                is_power1 = (net1 == vcc_net or net1 == gnd_net)
                is_power2 = (net2 == vcc_net or net2 == gnd_net)

                # ── Determinar columnas para cada pin ──
                col1: Optional[int] = None
                col2: Optional[int] = None

                # Resolver columnas ya asignadas
                if not is_power1 and net1 in net_column:
                    col1 = net_column[net1]
                if not is_power2 and net2 in net_column:
                    col2 = net_column[net2]

                # Calcular columnas faltantes
                if col1 is not None and col2 is not None:
                    pass  # Ambas conocidas, el componente une dos nets existentes
                elif col1 is not None and col2 is None:
                    # Pin1 tiene columna, Pin2 necesita una
                    col2 = max(col1 + self.PIN_SPACING, col_cursor)
                    if not is_power2:
                        net_column[net2] = col2
                    col_cursor = max(col_cursor, col2 + self.NET_SPACING)
                elif col2 is not None and col1 is None:
                    # Pin2 tiene columna, Pin1 necesita una
                    col1 = col_cursor
                    if not is_power1:
                        net_column[net1] = col1
                    col_cursor = max(col_cursor, col1 + self.NET_SPACING)
                else:
                    # Ninguna conocida -> asignar desde col_cursor
                    col1 = col_cursor
                    col2 = col_cursor + self.PIN_SPACING
                    if not is_power1:
                        net_column[net1] = col1
                    if not is_power2:
                        net_column[net2] = col2
                    col_cursor = max(col_cursor, col2 + self.NET_SPACING)

                # Asegurar col1 < col2 para orientacion consistente (izq a der)
                if col1 > col2:
                    pin1, pin2 = pin2, pin1
                    net1, net2 = net2, net1
                    col1, col2 = col2, col1
                    is_power1, is_power2 = is_power2, is_power1

                # ── Asignar fila (evitar conflictos en columnas compartidas) ──
                max_row_idx = max(row_at_col.get(col1, 0), row_at_col.get(col2, 0))
                if max_row_idx >= len(self.COMPONENT_ROWS):
                    max_row_idx = 0  # Wrap around si se agotan las filas
                row = self.COMPONENT_ROWS[max_row_idx]
                row_at_col[col1] = max_row_idx + 1
                row_at_col[col2] = max_row_idx + 1

                # ── Registrar posiciones fisicas ──
                pin_physical[f"{comp.id}.{pin1.name}"] = (row, col1)
                pin_physical[f"{comp.id}.{pin2.name}"] = (row, col2)

                placed_components.append(Component(
                    id=comp.id,
                    type=comp.type,
                    value=self._fix_value(comp.type, comp.value),
                    pins=[
                        Pin(name=pin1.name, position=f"{row}{col1}"),
                        Pin(name=pin2.name, position=f"{row}{col2}")
                    ],
                    breadboard=ComponentBreadboard(
                        row_start=row, col_start=col1,
                        row_end=row, col_end=col2
                    )
                ))

                # ── Encolar componentes adyacentes por net de señal ──
                for net in [net1, net2]:
                    if net and net != vcc_net and net != gnd_net:
                        for next_id, _ in net_to_pins.get(net, []):
                            if next_id not in placed_ids:
                                stack.append(next_id)

        # Ejecutar DFS para cada cadena
        for start_id in start_comps:
            if start_id not in placed_ids:
                place_chain(start_id)
                col_cursor += self.CHAIN_GAP  # Separación entre cadenas

        # Procesar componentes restantes no alcanzados por el DFS
        for comp in netlist.components:
            if comp.id not in placed_ids:
                place_chain(comp.id)

        # ═══════════════════════════════════════════════════════════
        # PASO 4: ENRUTAMIENTO (ROUTING)
        #
        # Solo generamos cables cuando la conexión interna del bus strip
        # NO es suficiente:
        # - Jumpers a rieles +/- para alimentación
        # - Jumpers entre columnas diferentes de la misma net
        # ═══════════════════════════════════════════════════════════
        connections: List[Connection] = []
        # Evitar duplicar jumpers al mismo punto del riel
        routed_power_cols: Set[Tuple[str, int]] = set()

        # 4a. Jumpers de alimentación: pines VCC → riel +, pines GND → riel -
        for comp in netlist.components:
            if battery and comp.id == battery.id:
                continue
            for pin in comp.pins:
                key = f"{comp.id}.{pin.name}"
                if key not in pin_physical:
                    continue
                pos = pin_physical[key]

                if pin.connected_to_net == vcc_net:
                    rail_key = ("+", pos[1])
                    if rail_key not in routed_power_cols:
                        connections.append(Connection(
                            from_component="power_rail",
                            from_pin="positive",
                            to_component=comp.id,
                            to_pin=pin.name,
                            wire_color="rojo",
                            breadboard=ConnectionBreadboard(
                                from_row="+", from_col=pos[1],
                                to_row=pos[0], to_col=pos[1]  # Usar la fila real del componente
                            )
                        ))
                        routed_power_cols.add(rail_key)

                elif pin.connected_to_net == gnd_net:
                    rail_key = ("-", pos[1])
                    if rail_key not in routed_power_cols:
                        connections.append(Connection(
                            from_component=comp.id,
                            from_pin=pin.name,
                            to_component="power_rail",
                            to_pin="negative",
                            wire_color="negro",
                            breadboard=ConnectionBreadboard(
                                from_row=pos[0], from_col=pos[1],  # Usar la fila real del componente
                                to_row="-", to_col=pos[1]
                            )
                        ))
                        routed_power_cols.add(rail_key)

        # 4b. Cables de señal: solo si pines de la misma net están en columnas diferentes
        signal_colors = ["verde", "amarillo", "naranja", "morado", "blanco"]
        for net_id, pins_in_net in net_to_pins.items():
            if net_id == vcc_net or net_id == gnd_net:
                continue

            physical = []
            for comp_id, pin_name in pins_in_net:
                key = f"{comp_id}.{pin_name}"
                if key in pin_physical:
                    physical.append((key, pin_physical[key]))

            if len(physical) < 2:
                continue

            # Si todos los pines están en la misma columna → conectados por bus strip
            cols = set(pos[1] for _, pos in physical)
            if len(cols) <= 1:
                continue  # No necesita cable, ¡la protoboard los conecta!

            # Pines en columnas diferentes → necesitan jumper
            for i in range(len(physical) - 1):
                key_a, pos_a = physical[i]
                key_b, pos_b = physical[i + 1]
                if pos_a[1] != pos_b[1]:
                    color = signal_colors[hash(net_id) % len(signal_colors)]
                    connections.append(Connection(
                        from_component=key_a.split(".")[0],
                        from_pin=key_a.split(".")[1],
                        to_component=key_b.split(".")[0],
                        to_pin=key_b.split(".")[1],
                        wire_color=color,
                        breadboard=ConnectionBreadboard(
                            from_row=pos_a[0], from_col=pos_a[1],
                            to_row=pos_b[0], to_col=pos_b[1]
                        )
                    ))

        # ═══════════════════════════════════════════════════════════
        # PASO 5: GENERACIÓN DE PASOS DE ENSAMBLAJE
        # ═══════════════════════════════════════════════════════════
        assembly_steps: List[AssemblyStep] = []

        # Pasos de colocación de componentes
        for idx, comp in enumerate(placed_components):
            # Adaptamos el nivel de andamiaje según el skill_level del usuario
            if skill_level == "Avanzado":
                if comp.breadboard.row_start in ["+", "-"]:
                    desc = f"Conectar a rieles: col {comp.breadboard.col_start} (+) y col {comp.breadboard.col_end} (-)."
                else:
                    desc = f"Posición: {comp.pins[0].position.upper()} a {comp.pins[1].position.upper()}."
            elif skill_level == "Intermedio":
                if comp.breadboard.row_start in ["+", "-"]:
                    desc = f"Inserta {comp.id} entre el riel positivo (col {comp.breadboard.col_start}) y negativo (col {comp.breadboard.col_end})."
                else:
                    desc = f"Inserta {comp.id} en los puntos {comp.pins[0].position.upper()} y {comp.pins[1].position.upper()}."
            else: # Principiante
                desc = f"Toma el componente {comp.id} (que es un {comp.type}). "
                if comp.breadboard.row_start in ["+", "-"]:
                    desc += f"Conecta su terminal positivo en el riel de energía (+) en la columna {comp.breadboard.col_start}. "
                    desc += f"Luego, conecta su terminal negativo en el riel (-) en la columna {comp.breadboard.col_end}. Asegúrate de que quede firme."
                else:
                    desc += f"Dobla sus patitas cuidadosamente e inserta el pin {comp.pins[0].name} en el agujero {comp.pins[0].position.upper()}. "
                    desc += f"Inserta el pin {comp.pins[1].name} en el agujero {comp.pins[1].position.upper()}."

            assembly_steps.append(AssemblyStep(
                step_number=idx + 1,
                title=f"Colocar {comp.id}" if skill_level != "Avanzado" else f"{comp.id}",
                description=desc,
                component_id=comp.id
            ))

        # Pasos de cableado (jumpers)
        step_num = len(placed_components) + 1
        for conn in connections:
            bb = conn.breadboard
            # Etiquetas legibles para las posiciones
            if bb.from_row in ["+", "-"]:
                from_label = f"riel {'(+)' if bb.from_row == '+' else '(-)'}, col {bb.from_col}"
            else:
                from_label = f"{bb.from_row.upper()}{bb.from_col}"

            if bb.to_row in ["+", "-"]:
                to_label = f"riel {'(+)' if bb.to_row == '+' else '(-)'}, col {bb.to_col}"
            else:
                to_label = f"{bb.to_row.upper()}{bb.to_col}"

            # Usar el componente real (no "power_rail") como component_id del paso
            real_comp = conn.to_component if conn.from_component == "power_rail" else conn.from_component

            if skill_level == "Avanzado":
                desc = f"{from_label} -> {to_label}"
                title = f"Jumper {conn.wire_color}"
            elif skill_level == "Intermedio":
                desc = f"Puentea desde {from_label} hasta {to_label}."
                title = f"Cable {conn.wire_color}"
            else:
                desc = f"Toma un cable de color {conn.wire_color}. Conecta un extremo en {from_label} y el otro extremo en {to_label} para cerrar el circuito."
                title = f"Conectar cable {conn.wire_color}"

            assembly_steps.append(AssemblyStep(
                step_number=step_num,
                title=title,
                description=desc,
                component_id=real_comp
            ))
            step_num += 1

        # ═══════════════════════════════════════════════════════════
        # RETORNO: Project completo para el Frontend
        # ═══════════════════════════════════════════════════════════
        return Project(
            circuit=Circuit(
                components=placed_components,
                connections=connections
            ),
            assembly_steps=assembly_steps
        )


auto_layout_service = AutoLayoutService()
