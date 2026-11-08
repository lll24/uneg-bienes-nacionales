from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.database import get_session
from app.core.security import create_access_token, verify_password
from app.models.entities import Usuario
from app.schemas.token import Token
from app.schemas.usuario import LoginRequest, UsuarioRead

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest,
    session: Annotated[Session, Depends(get_session)],
):
    statement = select(Usuario).where(Usuario.cedula == login_data.cedula)
    user = session.exec(statement).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cédula o contraseña incorrecta.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo en el sistema.",
        )

    access_token = create_access_token(
        subject=user.cedula,
        extra_claims={"rol": user.rol.value, "nombre": user.nombre},
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        rol=user.rol,
        nombre=user.nombre,
        cedula=user.cedula,
        usuario_id=user.id,
    )


@router.get("/me", response_model=UsuarioRead)
def read_current_user(
    current_user: Annotated[Usuario, Depends(get_current_user)],
):
    return current_user

