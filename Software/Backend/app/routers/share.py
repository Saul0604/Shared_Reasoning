from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
import secrets
from datetime import datetime

from app.core.database import get_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatSessionRead
from app.models.share import ProjectShare

router = APIRouter(
    prefix="/share",
    tags=["Share"],
)

# 1. Generar token y enlace de compartir para un proyecto
@router.post("/sessions/{chat_id}", response_model=str)
def generate_share_token(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Validar que el proyecto pertenezca al usuario actual
    db_session = session.get(ChatSession, chat_id)
    if not db_session or db_session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
    # Verificar si ya existe un token activo para este proyecto
    statement = select(ProjectShare).where(
        ProjectShare.chat_session_id == chat_id, 
        ProjectShare.shared_by_user_id == current_user.id
    )
    existing_share = session.exec(statement).first()
    
    if existing_share:
        return existing_share.share_token
        
    # Generar un token único aleatorio
    token = secrets.token_urlsafe(16)
    
    new_share = ProjectShare(
        chat_session_id=chat_id,
        shared_by_user_id=current_user.id,
        share_token=token
    )
    
    session.add(new_share)
    session.commit()
    return token

# 2. Reclamar / Agregar proyecto compartido usando el token
@router.post("/resolve/{token}", response_model=ChatSessionRead)
def resolve_share_token(
    token: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(ProjectShare).where(ProjectShare.share_token == token)
    share_record = session.exec(statement).first()
    
    if not share_record:
        raise HTTPException(status_code=404, detail="Enlace compartido inválido o expirado")
        
    # Validar que el dueño no intente agregarse a sí mismo
    if share_record.shared_by_user_id == current_user.id:
        # Redirigir al proyecto directamente sin duplicar
        project = session.get(ChatSession, share_record.chat_session_id)
        return project
        
    # Verificar si el usuario ya tiene reclamado este proyecto
    dup_statement = select(ProjectShare).where(
        ProjectShare.chat_session_id == share_record.chat_session_id,
        ProjectShare.shared_to_user_id == current_user.id
    )
    existing_claim = session.exec(dup_statement).first()
    
    if not existing_claim:
        # Vincular el proyecto al usuario receptor
        claim_share = ProjectShare(
            chat_session_id=share_record.chat_session_id,
            shared_by_user_id=share_record.shared_by_user_id,
            shared_to_user_id=current_user.id,
            share_token=secrets.token_urlsafe(16) # Token dummy para evitar colisión de unique
        )
        session.add(claim_share)
        session.commit()
        
    project = session.get(ChatSession, share_record.chat_session_id)
    return project

# 3. Listar proyectos compartidos contigo
@router.get("/received", response_model=List[ChatSessionRead])
def get_received_shares(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Traer todos los registros donde shared_to_user_id sea el usuario actual
    statement = select(ProjectShare).where(ProjectShare.shared_to_user_id == current_user.id)
    shares = session.exec(statement).all()
    
    session_ids = [s.chat_session_id for s in shares]
    if not session_ids:
        return []
        
    project_statement = select(ChatSession).where(ChatSession.id.in_(session_ids))
    return session.exec(project_statement).all()
