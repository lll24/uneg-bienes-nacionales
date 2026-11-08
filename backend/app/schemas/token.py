from typing import Optional
from pydantic import BaseModel
from app.models.enums import RolUsuario


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: RolUsuario
    nombre: str
    cedula: str
    usuario_id: int


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    rol: Optional[str] = None
    exp: Optional[int] = None

