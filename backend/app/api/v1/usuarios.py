from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.deps import RoleChecker, get_current_user
from app.core.database import get_session
from app.core.security import get_password_hash
from app.models.entities import Usuario
from app.models.enums import RolUsuario
from app.schemas.usuario import UsuarioCreate, UsuarioRead, UsuarioUpdate

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

# Permisos
allow_admin_or_jefe = RoleChecker([RolUsuario.ADMINISTRADOR, RolUsuario.JEFE])


@router.get("", response_model=List[UsuarioRead])
def list_usuarios(
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(get_current_user)],
    rol: Optional[RolUsuario] = Query(None, description="Filtrar por rol"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    query = select(Usuario)
    if rol:
        query = query.where(Usuario.rol == rol)
    usuarios = session.exec(query.offset(skip).limit(limit)).all()
    return usuarios


@router.post("", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
def create_usuario(
    usuario_in: UsuarioCreate,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(allow_admin_or_jefe)],
):
    # Verificar cédula única
    existing = session.exec(select(Usuario).where(Usuario.cedula == usuario_in.cedula)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un usuario registrado con la cédula {usuario_in.cedula}",
        )

    db_usuario = Usuario(
        nombre=usuario_in.nombre,
        cedula=usuario_in.cedula,
        rol=usuario_in.rol,
        is_active=usuario_in.is_active,
        hashed_password=get_password_hash(usuario_in.password),
    )
    session.add(db_usuario)
    session.commit()
    session.refresh(db_usuario)
    return db_usuario


@router.get("/{usuario_id}", response_model=UsuarioRead)
def get_usuario(
    usuario_id: int,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(get_current_user)],
):
    usuario = session.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioRead)
def update_usuario(
    usuario_id: int,
    usuario_in: UsuarioUpdate,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(allow_admin_or_jefe)],
):
    db_usuario = session.get(Usuario, usuario_id)
    if not db_usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    update_data = usuario_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        db_usuario.hashed_password = get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(db_usuario, key, value)

    session.add(db_usuario)
    session.commit()
    session.refresh(db_usuario)
    return db_usuario

