from typing import Annotated, Generator, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import decode_token
from app.models.entities import Usuario
from app.models.enums import RolUsuario

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> Usuario:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de autenticación no suministradas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    cedula: str = payload["sub"]
    statement = select(Usuario).where(Usuario.cedula == cedula)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado en la base de datos.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo.",
        )

    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[RolUsuario]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: Annotated[Usuario, Depends(get_current_user)]) -> Usuario:
        if current_user.rol not in self.allowed_roles:
            roles_permitidos = [r.value for r in self.allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de los siguientes roles: {', '.join(roles_permitidos)}. Rol actual: {current_user.rol.value}",
            )
        return current_user

