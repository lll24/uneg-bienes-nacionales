import os
import shutil
import uuid
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_session
from app.models.entities import Bien, Tramite, Usuario
from app.models.enums import EstatusTramite, TipoTramite
from app.schemas.tramite import TramiteCreate, TramiteDecision, TramiteRead
from app.services.tramite_service import resolver_tramite, verificar_permiso_tramite

router = APIRouter(prefix="/tramites", tags=["Trámites y Flujos"])


@router.post("/evidencia", response_model=dict)
def upload_evidencia(
    file: UploadFile = File(...),
    _: Annotated[Usuario, Depends(get_current_user)] = None,
):
    """
    Subida de evidencia multimedia (informe técnico en PDF, fotografías de avería o estado físico).
    Especialmente utilizado por el Documentalista para armar el expediente de Desincorporación.
    """
    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido. Extensiones válidas: {', '.join(allowed_extensions)}",
        )

    # Crear carpeta de uploads si no existe
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    file_uuid = uuid.uuid4().hex
    safe_filename = f"{file_uuid}{extension}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "url_evidencia_multimedia": f"/uploads/{safe_filename}",
        "nombre_original": file.filename,
    }


@router.get("", response_model=List[TramiteRead])
def list_tramites(
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(get_current_user)],
    tipo: Optional[TipoTramite] = Query(None, description="Filtrar por tipo de trámite"),
    estatus: Optional[str] = Query(None, description="Filtrar por estatus"),
    bien_id: Optional[int] = Query(None, description="Filtrar por bien"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    query = select(Tramite)
    if tipo:
        query = query.where(Tramite.tipo == tipo)
    if estatus:
        query = query.where(Tramite.estatus_tramite == estatus)
    if bien_id:
        query = query.where(Tramite.bien_id == bien_id)

    tramites = session.exec(query.offset(skip).limit(limit)).all()
    return tramites


@router.post("", response_model=TramiteRead, status_code=status.HTTP_201_CREATED)
def create_tramite(
    tramite_in: TramiteCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[Usuario, Depends(get_current_user)],
):
    """
    Inicia un trámite patrimonial:
    - Incorporación: Registrador
    - Desincorporación: Documentalista (carga expediente técnico) o RPU (reporta avería)
    - Reasignación: RPU / Administrador
    - Préstamo: RPU / Administrador
    """
    verificar_permiso_tramite(current_user, tramite_in.tipo)

    # Validar existencia del bien
    bien = session.get(Bien, tramite_in.bien_id)
    if not bien:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bien no encontrado")

    db_tramite = Tramite(
        tipo=tramite_in.tipo,
        bien_id=tramite_in.bien_id,
        solicitante_id=current_user.id,
        motivo=tramite_in.motivo,
        url_evidencia_multimedia=tramite_in.url_evidencia_multimedia,
        estatus_tramite=EstatusTramite.PENDIENTE.value,
    )
    session.add(db_tramite)
    session.commit()
    session.refresh(db_tramite)
    return db_tramite


@router.get("/{tramite_id}", response_model=TramiteRead)
def get_tramite(
    tramite_id: int,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(get_current_user)],
):
    tramite = session.get(Tramite, tramite_id)
    if not tramite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trámite no encontrado")
    return tramite


@router.post("/{tramite_id}/decidir", response_model=TramiteRead)
def decidir_tramite(
    tramite_id: int,
    decision: TramiteDecision,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[Usuario, Depends(get_current_user)],
):
    """
    Aprobación o Rechazo de un Trámite:
    - Jefe: Aprobación final obligatoria para Reasignaciones y Desincorporaciones.
    - Administrador: Aprueba Préstamos temporales y gestión general.
    """
    tramite = session.get(Tramite, tramite_id)
    if not tramite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trámite no encontrado")

    tramite_procesado = resolver_tramite(session, tramite, decision, current_user)
    return tramite_procesado

