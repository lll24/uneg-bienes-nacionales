import os
import shutil
import uuid
from typing import Annotated, Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlmodel import Session, col, or_, select, cast, String

from app.api.deps import RoleChecker, get_current_user
from app.core.config import settings
from app.core.database import get_session
from app.models.entities import Bien, Ubicacion, Usuario
from app.models.enums import EstadoBien, OrigenIngreso, RolUsuario
from app.schemas.bien import BienCreate, BienRead, BienUpdate, BienWithDetails
from app.services.correlativo import generar_correlativo

router = APIRouter(prefix="/bienes", tags=["Bienes e Inventario"])

# Roles autorizados para dar de alta bienes (Control Perceptivo / Almacén)
allow_incorporador = RoleChecker([
    RolUsuario.REGISTRADOR,
    RolUsuario.ADMINISTRADOR,
    RolUsuario.JEFE,
])

# Roles con acceso a reportes de auditoría
allow_auditor = RoleChecker([
    RolUsuario.AUDITOR,
    RolUsuario.ADMINISTRADOR,
    RolUsuario.JEFE,
])


@router.post("/documento-soporte", response_model=dict)
def upload_documento_soporte(
    file: UploadFile = File(...),
    _: Annotated[Usuario, Depends(allow_incorporador)] = None,
):
    """
    Subida de documentos de respaldo de entrada:
    - Compra: Factura digital o solicitud de compra (PDF / Imagen)
    - Donación: Carta de aprobación del Consejo Universitario (PDF / Imagen)
    - Otros: Justificativo documental de ingreso
    """
    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido. Extensiones válidas: {', '.join(allowed_extensions)}",
        )

    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    file_uuid = uuid.uuid4().hex
    safe_filename = f"origen_{file_uuid}{extension}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "url_documento_origen": f"/uploads/{safe_filename}",
        "nombre_original": file.filename,
    }


@router.get("", response_model=List[BienWithDetails])
def list_bienes(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[Usuario, Depends(get_current_user)],
    estado: Optional[EstadoBien] = Query(None, description="Filtrar por estado del bien"),
    origen_ingreso: Optional[OrigenIngreso] = Query(None, description="Filtrar por modalidad de entrada"),
    familia: Optional[str] = Query(None, description="Filtrar por familia patrimonial UNEG"),
    responsable_id: Optional[int] = Query(None, description="Filtrar por custodio responsable"),
    ubicacion_id: Optional[int] = Query(None, description="Filtrar por ubicación"),
    search: Optional[str] = Query(None, description="Buscar por correlativo, serial, descripción, orden de compra, factura..."),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
):
    query = select(Bien)

    if current_user.rol == RolUsuario.RPU and responsable_id is None:
        responsable_id = current_user.id

    if estado:
        query = query.where(Bien.estado == estado)
    if origen_ingreso:
        query = query.where(Bien.origen_ingreso == origen_ingreso)
    if familia:
        query = query.where(col(Bien.familia).ilike(f"%{familia}%"))
    if responsable_id:
        query = query.where(Bien.responsable_id == responsable_id)
    if ubicacion_id:
        query = query.where(Bien.ubicacion_id == ubicacion_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                cast(Bien.correlativo, String).ilike(search_pattern),
                col(Bien.descripcion).ilike(search_pattern),
                col(Bien.serial).ilike(search_pattern),
                col(Bien.codigo_serie).ilike(search_pattern),
                col(Bien.orden_compra).ilike(search_pattern),
                col(Bien.numero_factura).ilike(search_pattern),
                col(Bien.documento_aprobacion).ilike(search_pattern),
                col(Bien.marca).ilike(search_pattern),
                col(Bien.modelo).ilike(search_pattern),
            )
        )

    query = query.order_by(col(Bien.correlativo).desc())
    bienes = session.exec(query.offset(skip).limit(limit)).all()
    return bienes


@router.post("", response_model=BienWithDetails, status_code=status.HTTP_201_CREATED)
def create_bien(
    bien_in: BienCreate,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(allow_incorporador)],
):
    """
    Control Perceptivo e Incorporación de Bien (Almacén):
    Valida requisitos condicionales según el Origen de Ingreso:
    - Compra: requiere Orden de Compra o Factura
    - Donación: requiere Carta de Aprobación por la Universidad
    - Fabricación: no requiere documento obligatorio
    - Otros: requiere observación y documento de respaldo opcional
    """
    # Validación condicional según origen
    if bien_in.origen_ingreso == OrigenIngreso.COMPRA:
        if not bien_in.orden_compra and not bien_in.numero_factura:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para ingresos por Compra debe indicar la Orden de Compra o Número de Factura.",
            )
    elif bien_in.origen_ingreso == OrigenIngreso.DONACION:
        if not bien_in.documento_aprobacion and not bien_in.url_documento_origen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para ingresos por Donación debe registrar el número o adjuntar la Carta de Aprobación de la Universidad.",
            )
    elif bien_in.origen_ingreso == OrigenIngreso.OTROS:
        if not bien_in.observaciones and not bien_in.motivo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para ingresos bajo la modalidad Otros debe detallar una observación o motivo de entrada.",
            )

    ubicacion = session.get(Ubicacion, bien_in.ubicacion_id)
    if not ubicacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ubicación no encontrada")

    responsable = session.get(Usuario, bien_in.responsable_id)
    if not responsable:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responsable no encontrado")

    correlativo = bien_in.correlativo or generar_correlativo(session)

    existing = session.exec(select(Bien).where(Bien.correlativo == correlativo)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El número correlativo {correlativo} ya se encuentra asignado a otro bien.",
        )

    bien_data = bien_in.model_dump()
    bien_data["correlativo"] = correlativo

    if not bien_data.get("numero_ficha_responsable") and responsable.numero_ficha:
        bien_data["numero_ficha_responsable"] = responsable.numero_ficha

    db_bien = Bien(**bien_data)
    session.add(db_bien)
    session.commit()
    session.refresh(db_bien)
    return db_bien


@router.get("/auditoria/reporte-por-responsable", response_model=Dict[str, Any])
def auditoria_por_responsable(
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(allow_auditor)],
    responsable_id: Optional[int] = Query(None, description="Filtrar por responsable específico"),
):
    """Módulo de Auditoría: Reporte consolidado agrupado por responsable patrimonial (RPU)."""
    query = select(Usuario)
    if responsable_id:
        query = query.where(Usuario.id == responsable_id)

    usuarios = session.exec(query).all()
    reporte = []

    for user in usuarios:
        bienes_user = session.exec(
            select(Bien).where(Bien.responsable_id == user.id).order_by(col(Bien.correlativo))
        ).all()

        if bienes_user or responsable_id:
            reporte.append({
                "responsable": {
                    "id": user.id,
                    "nombre": user.nombre,
                    "cedula": user.cedula,
                    "rol": user.rol.value,
                    "numero_ficha": user.numero_ficha,
                },
                "total_bienes": len(bienes_user),
                "bienes": [
                    {
                        "id": b.id,
                        "correlativo": b.correlativo,
                        "familia": b.familia,
                        "descripcion": b.descripcion,
                        "marca": b.marca,
                        "modelo": b.modelo,
                        "serial": b.serial,
                        "estado": b.estado.value,
                        "origen_ingreso": b.origen_ingreso.value,
                        "orden_compra": b.orden_compra,
                        "numero_factura": b.numero_factura,
                        "documento_aprobacion": b.documento_aprobacion,
                        "codigo_contable": b.codigo_contable,
                        "ubicacion": b.ubicacion.nombre if b.ubicacion else None,
                    }
                    for b in bienes_user
                ],
            })

    return {
        "total_responsables": len(reporte),
        "data": reporte,
    }


@router.get("/{bien_id}", response_model=BienWithDetails)
def get_bien(
    bien_id: int,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(get_current_user)],
):
    bien = session.get(Bien, bien_id)
    if not bien:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bien no encontrado")
    return bien


@router.put("/{bien_id}", response_model=BienWithDetails)
def update_bien(
    bien_id: int,
    bien_in: BienUpdate,
    session: Annotated[Session, Depends(get_session)],
    _: Annotated[Usuario, Depends(allow_incorporador)],
):
    bien = session.get(Bien, bien_id)
    if not bien:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bien no encontrado")

    update_data = bien_in.model_dump(exclude_unset=True)
    if "ubicacion_id" in update_data and update_data["ubicacion_id"]:
        if not session.get(Ubicacion, update_data["ubicacion_id"]):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ubicación no encontrada")
    if "responsable_id" in update_data and update_data["responsable_id"]:
        if not session.get(Usuario, update_data["responsable_id"]):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Responsable no encontrado")

    for key, value in update_data.items():
        setattr(bien, key, value)

    session.add(bien)
    session.commit()
    session.refresh(bien)
    return bien
