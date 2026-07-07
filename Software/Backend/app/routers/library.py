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
