# Shared Reasoning Backend

Backend del proyecto **Shared Reasoning: Human–AI Co-execution of Physical Tasks**, desarrollado durante el Programa Delfín 2026 en EAFIT.

## Tecnologías

- Python 3.13+
- FastAPI
- Uvicorn
- OpenAI API
- Pydantic
- python-dotenv

---

# Estructura del proyecto

```text
Backend/

├── app/
│   ├── agents/
│   ├── core/
│   ├── routers/
│   ├── schemas/
│   ├── services/
│   ├── __init__.py
│   └── main.py
│
├── .env
├── .gitignore
├── requirements.txt
└── README.md
```

---

# Requisitos

- Python 3.13 o superior
- Git

---

# Instalación

## 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
```

Entrar al proyecto

```bash
cd Software/Backend
```

---

## 2. Crear un entorno virtual

Windows

```powershell
python -m venv .venv
```

Mac/Linux

```bash
python3 -m venv .venv
```

---

## 3. Activar el entorno virtual

Windows

```powershell
.venv\Scripts\activate
```

Mac/Linux

```bash
source .venv/bin/activate
```

---

## 4. Instalar dependencias

```bash
pip install -r requirements.txt
```

---

## 5. Configurar variables de entorno

Crear un archivo llamado

```text
.env
```

con el siguiente contenido

```text
(aun pendiente lo del .env)
```

---

## 6. Ejecutar el servidor

```bash
uvicorn app.main:app --reload
```

---

# Documentación

Swagger

```
http://127.0.0.1:8000/docs
```

Redoc

```
http://127.0.0.1:8000/redoc
```

---

# Estado actual

Actualmente el backend cuenta con:

- ✅ FastAPI
- ✅ Router Health
- ⏳ Integración OpenAI
- ⏳ Endpoint Extract
- ⏳ LangGraph
- ⏳ Circuit State Schema

---

# Convención de ramas

```text
main
```

Versión estable.

```text
dev
```

Integración.

```text
feature/nombre-feature
```

Desarrollo de nuevas funcionalidades.

---

# Convención de commits

```
feat:
```

Nueva funcionalidad.

```
fix:
```

Corrección de errores.

```
docs:
```

Cambios en documentación.

```
refactor:
```

Refactorización.

```
test:
```

Pruebas.

---

# Equipo

Programa Delfín 2026

Escuela de Ciencias Aplicadas e Ingeniería

Universidad EAFIT