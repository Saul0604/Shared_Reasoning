from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import List, Optional
import os
import shutil
import uuid

from app.core.database import get_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.library import LibraryMaterial
from app.services.gemini_service import get_ai_service
from app.schemas.tutorial import ComponentTutorial
from pydantic import BaseModel
from typing import List, Dict

class TutorialChatRequest(BaseModel):
    component_name: str
    message: str
    history: List[Dict[str, str]] = []


router = APIRouter(
    prefix="/library",
    tags=["Library"],
)

UPLOAD_DIR = os.path.join("uploads", "library")

# Asegurar que el directorio de uploads exista
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 1. Subir material de estudio (Libros, PDFs, Guías, Datasheets)
@router.post("/upload", response_model=LibraryMaterial)
def upload_material(
    title: str = Form(...),
    category: str = Form(...),
    difficulty: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Validar que sea un archivo PDF u otro formato compatible
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    
    # Generar un nombre único para evitar colisiones
    unique_filename = f"{uuid.uuid4()}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        # Guardar archivo físicamente en el disco
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar el archivo en el servidor: {str(e)}"
        )
        
    # Crear registro en la base de datos
    db_material = LibraryMaterial(
        title=title,
        category=category,
        difficulty=difficulty,
        file_path=dest_path,
        progress=0
    )
    
    session.add(db_material)
    session.commit()
    session.refresh(db_material)
    
    return db_material

# 2. Obtener lista global de materiales
@router.get("", response_model=List[LibraryMaterial])
def get_library_materials(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(LibraryMaterial)
    if category:
        statement = statement.where(LibraryMaterial.category == category)
    if difficulty:
        statement = statement.where(LibraryMaterial.difficulty == difficulty)
        
    statement = statement.order_by(LibraryMaterial.created_at.desc())
    return session.exec(statement).all()

# 3. Descargar o servir un archivo en el navegador
@router.get("/download/{material_id}")
def download_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_material = session.get(LibraryMaterial, material_id)
    if not db_material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
        
    if not os.path.exists(db_material.file_path):
        raise HTTPException(status_code=404, detail="El archivo físico no existe en el servidor")
        
    # Determinar el content-type adecuado (ej. application/pdf)
    media_type = "application/octet-stream"
    if db_material.file_path.endswith(".pdf"):
        media_type = "application/pdf"
        
    # Servir el archivo de forma nativa
    return FileResponse(
        path=db_material.file_path,
        media_type=media_type,
        filename=os.path.basename(db_material.file_path)
    )

# 4. Eliminar material de la biblioteca compartida
@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_material = session.get(LibraryMaterial, material_id)
    if not db_material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
        
    # Intentar borrar el archivo físico del disco primero
    if os.path.exists(db_material.file_path):
        try:
            os.remove(db_material.file_path)
        except Exception as e:
            print(f"Advertencia al borrar archivo: {str(e)}")
            
    # Eliminar registro de la base de datos
    session.delete(db_material)
    session.commit()
    return None

# 5. Generar un tutorial dinámico con IA para un componente
@router.get("/tutorial/{component_name}", response_model=ComponentTutorial)
def get_component_tutorial(
    component_name: str,
    current_user: User = Depends(get_current_user)
):
    ai_service = get_ai_service()
    
    prompt = f"""
Eres un ingeniero experto en electrónica.
El usuario necesita un tutorial rápido y amigable sobre el siguiente componente: {component_name}.

Explícalo de forma concisa y amigable, utilizando español neutro.

INSTRUCCIONES:
1. 'summary': Una definición breve y simple (1-2 oraciones).
2. 'how_it_works': Explica el principio básico de funcionamiento.
3. 'common_uses': Da 3 ejemplos de aplicaciones muy comunes.
4. 'connection_tips': Da 2 consejos clave al conectarlo en la protoboard o el circuito (ej. polaridad, uso de resistencias, pines típicos).

IMPORTANTE: Responde SOLO con el JSON válido siguiendo el esquema proporcionado. No agregues markdown adicional fuera del JSON.
"""

    tutorial = ai_service.structured_completion(prompt, ComponentTutorial)
    return tutorial

# 6. Chat para preguntas de seguimiento en el tutorial
@router.post("/tutorial-chat")
def tutorial_chat(
    req: TutorialChatRequest,
    current_user: User = Depends(get_current_user)
):
    ai_service = get_ai_service()
    system_instruction = f"Eres un asistente de electrónica que está ayudando a un estudiante a entender el componente '{req.component_name}'. Responde de manera concisa y clara a sus dudas."
    
    messages = req.history + [{"role": "user", "content": req.message}]
    
    response_text = ai_service.chat_completion(system_instruction, messages)
    return {"reply": response_text}
