from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.deps import RoleChecker, get_current_user
from app.core.database import get_session
from app.models.entities import Ubicacion, Usuario
from app.models.enums import RolUsuario
from app.schemas.ubicacion import UbicacionCreate, UbicacionRead, UbicacionUpdate

router = APIRouter(prefix="/ubicaciones", tags=["Ubicaciones"])

allow_staff = RoleChecker([
    RolUsuario.ADMINISTRADOR,
    RolUsuario.JEFE,
    RolUsuario.REGISTRADOR,
])


@router.get("", response_model=List[UbicacionRead])
def list_ubicaciones(
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(get_current_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    statement = select(Ubicacion).offset(skip).limit(limit)
    return session.exec(statement).all()


@router.post("", response_model=UbicacionRead, status_code=status.HTTP_201_CREATED)
def create_ubicacion(
    ubicacion_in: UbicacionCreate,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(allow_staff)],
):
    ubicacion = Ubicacion.model_validate(ubicacion_in)
    session.add(ubicacion)
    session.commit()
    session.refresh(ubicacion)
    return ubicacion


@router.get("/{ubicacion_id}", response_model=UbicacionRead)
def get_ubicacion(
    ubicacion_id: int,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(get_current_user)],
):
    ubicacion = session.get(Ubicacion, ubicacion_id)
    if not ubicacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ubicación no encontrada")
    return ubicacion


@router.put("/{ubicacion_id}", response_model=UbicacionRead)
def update_ubicacion(
    ubicacion_id: int,
    ubicacion_in: UbicacionUpdate,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(allow_staff)],
):
    ubicacion = session.get(Ubicacion, ubicacion_id)
    if not ubicacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ubicación no encontrada")

    update_data = ubicacion_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ubicacion, key, value)

    session.add(ubicacion)
    session.commit()
    session.refresh(ubicacion)
    return ubicacion

