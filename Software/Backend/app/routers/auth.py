from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select, SQLModel
from jose import jwt, JWTError

from app.core.database import get_session
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, UserCreate, UserRead, Token

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Dependencia para obtener el usuario autenticado actual desde el token JWT
def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"[DEBUG AUTH] Decodificando token: {token[:20]}...")
        print(f"[DEBUG AUTH] Usando SECRET_KEY: {settings.SECRET_KEY[:10]}... | ALGORITHM: {settings.ALGORITHM}")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        print(f"[DEBUG AUTH] Token decodificado con éxito. Email: {email}")
        if email is None:
            print("[DEBUG AUTH] Error: El campo 'sub' (email) es nulo.")
            raise credentials_exception
    except JWTError as e:
        print(f"[DEBUG AUTH] Falló decodificación de JWT por error: {str(e)}")
        raise credentials_exception
        
    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()
    if user is None:
        print(f"[DEBUG AUTH] Error: No se encontró al usuario {email} en la base de datos.")
        raise credentials_exception
    return user

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    # Validar si el email ya existe
    statement = select(User).where(User.email == user_in.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este correo electrónico ya está registrado"
        )
    
    # Crear nuevo usuario
    hashed_pwd = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pwd
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    # Buscar usuario por email (form_data.username se usa para el login)
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correo electrónico o contraseña incorrectos"
        )
    
    # Generar token JWT
    access_token = create_access_token(subject=user.email)
    return Token(access_token=access_token, token_type="bearer")

# Esquema para actualización de perfil
class UserProfileUpdate(SQLModel):
    full_name: Optional[str] = None
    profile_picture_base64: Optional[str] = None

@router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/profile", response_model=UserRead)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.profile_picture_base64 is not None:
        current_user.profile_picture_base64 = profile_in.profile_picture_base64
        
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user
