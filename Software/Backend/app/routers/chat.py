from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
import json

from app.core.database import get_session
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.chat import (
    ChatSession, ChatSessionCreate, ChatSessionRead,
    ChatMessage, ChatMessageRead
)
from app.models.share import ProjectShare
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage as SchemaChatMessage
from app.services.chat_service import ChatService

router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)

service = ChatService()

def check_session_access(chat_id: int, user_id: int, session: Session) -> ChatSession:
    db_session = session.get(ChatSession, chat_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Sesión de chat no encontrada")
        
    # Si es el dueño
    if db_session.user_id == user_id:
        return db_session
        
    # Si ha sido compartida con él
    statement = select(ProjectShare).where(
        ProjectShare.chat_session_id == chat_id,
        ProjectShare.shared_to_user_id == user_id
    )
    is_shared = session.exec(statement).first()
    if is_shared:
        return db_session
        
    raise HTTPException(status_code=404, detail="Sesión de chat no encontrada")

# 1. Listar todas las sesiones de chat del usuario autenticado
@router.get("/sessions", response_model=List[ChatSessionRead])
def get_sessions(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(ChatSession).where(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc())
    return session.exec(statement).all()

# 2. Crear una nueva sesión de chat
@router.post("/sessions", response_model=ChatSessionRead)
def create_session(
    chat_in: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_session = ChatSession(
        title=chat_in.title or "Nuevo Circuito",
        user_id=current_user.id,
        schema_image_base64=chat_in.schema_image_base64,
        is_favorite=chat_in.is_favorite or False
    )
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session

# Toggle el estado favorito de una sesión de chat
@router.patch("/sessions/{chat_id}/favorite", response_model=ChatSessionRead)
def toggle_favorite_session(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_session = session.get(ChatSession, chat_id)
    if not db_session or db_session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Sesión de chat no encontrada")
    
    db_session.is_favorite = not db_session.is_favorite
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session

# 3. Eliminar una sesión de chat
@router.delete("/sessions/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_session = session.get(ChatSession, chat_id)
    if not db_session or db_session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Sesión de chat no encontrada")
    session.delete(db_session)
    session.commit()
    return None

# 4. Obtener todos los mensajes de una sesión
@router.get("/sessions/{chat_id}/messages", response_model=List[ChatMessageRead])
def get_session_messages(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_session = check_session_access(chat_id, current_user.id, session)
    
    statement = select(ChatMessage).where(ChatMessage.chat_session_id == chat_id).order_by(ChatMessage.timestamp.asc())
    return session.exec(statement).all()

# 5. Enviar mensaje en una sesión de chat específica y guardar la conversación completa
@router.post("/sessions/{chat_id}/message", response_model=ChatResponse)
def post_chat_message(
    chat_id: int,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Validar propiedad del chat (o acceso compartido)
    db_session = check_session_access(chat_id, current_user.id, session)

    # 1. Llamar primero al servicio de la IA. Si esto falla, no guardamos nada en BD.
    try:
        response = service.chat(request, provider=request.provider)
    except Exception as e:
        # Si la IA falla (ej. sin tokens, timeout, etc.), lanzamos error sin guardar
        raise HTTPException(
            status_code=500, 
            detail=f"El tutor de IA no pudo responder en este momento: {str(e)}"
        )

    # 2. Si la IA responde con éxito, guardamos ambos mensajes de manera atómica
    project_ctx_str = json.dumps(request.project_context) if request.project_context else None
    
    # Mensaje del usuario
    user_msg = ChatMessage(
        chat_session_id=chat_id,
        role="user",
        content=request.message,
        project_context_json=project_ctx_str,
        current_step=request.current_step
    )
    session.add(user_msg)
    
    # Renombrar chat si tiene título genérico
    if db_session.title == "Nuevo Circuito":
        words = request.message.split()
        title_suggestion = " ".join(words[:4])
        if len(title_suggestion) > 30:
            title_suggestion = title_suggestion[:27] + "..."
        db_session.title = title_suggestion or "Conversación"
        session.add(db_session)

    # Mensaje del asistente
    assistant_msg = ChatMessage(
        chat_session_id=chat_id,
        role="assistant",
        content=response.reply,
        project_context_json=project_ctx_str,
        current_step=request.current_step
    )
    session.add(assistant_msg)
    
    # Confirmar cambios de forma segura
    session.commit()

    return response

# Endpoint legacy/anterior para compatibilidad si no está logueado
@router.post("", response_model=ChatResponse)
def chat_legacy(request: ChatRequest):
    return service.chat(request, provider=request.provider)
