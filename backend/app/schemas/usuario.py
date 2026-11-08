from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import RolUsuario


class UsuarioBase(BaseModel):
    nombre: str
    cedula: str
    rol: RolUsuario
    is_active: bool = True
    numero_ficha: Optional[str] = None


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    cedula: Optional[str] = None
    rol: Optional[RolUsuario] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    numero_ficha: Optional[str] = None


class UsuarioRead(UsuarioBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    cedula: str
    password: str

