from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlmodel import Session

from app.models.entities import Bien, Tramite, Usuario
from app.models.enums import EstadoBien, EstatusTramite, RolUsuario, TipoTramite
from app.schemas.tramite import TramiteDecision


def verificar_permiso_tramite(solicitante: Usuario, tipo: TipoTramite) -> None:
    """Verifica si el usuario tiene permiso para crear un tipo de trámite específico."""
    if tipo == TipoTramite.INCORPORACION and solicitante.rol not in [
        RolUsuario.REGISTRADOR,
        RolUsuario.ADMINISTRADOR,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los Registradores (o Administradores) pueden iniciar trámites de Incorporación.",
        )

    if tipo == TipoTramite.DESINCORPORACION and solicitante.rol not in [
        RolUsuario.DOCUMENTALISTA,
        RolUsuario.RPU,
        RolUsuario.ADMINISTRADOR,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo Documentalistas, RPU o Administradores pueden iniciar solicitudes de Desincorporación.",
        )


def resolver_tramite(
    session: Session,
    tramite: Tramite,
    decision: TramiteDecision,
    aprobador: Usuario,
) -> Tramite:
    """Aplica las reglas de negocio RBAC para aprobar o rechazar un trámite."""
    if tramite.estatus_tramite != EstatusTramite.PENDIENTE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El trámite ya fue procesado con estado: {tramite.estatus_tramite}",
        )

    # Reglas de Aprobación según rol y tipo de trámite
    if tramite.tipo in [TipoTramite.REASIGNACION, TipoTramite.DESINCORPORACION]:
        if aprobador.rol != RolUsuario.JEFE and aprobador.rol != RolUsuario.ADMINISTRADOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"La aprobación final de {tramite.tipo.value} requiere el rol de Jefe.",
            )
    elif tramite.tipo == TipoTramite.PRESTAMO:
        if aprobador.rol not in [RolUsuario.ADMINISTRADOR, RolUsuario.JEFE]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La aprobación de préstamos temporales corresponde al Administrador o Jefe.",
            )

    tramite.estatus_tramite = decision.accion.value
    tramite.aprobado_por_id = aprobador.id
    tramite.fecha_resolucion = datetime.now(timezone.utc)
    if decision.observaciones:
        tramite.motivo = (tramite.motivo or "") + f" [Resolución: {decision.observaciones}]"

    # Si se aprueba, actualizar el estado unificado y asignación del Bien
    bien = session.get(Bien, tramite.bien_id)
    if not bien:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El bien asociado a este trámite no existe.",
        )

    if decision.accion == EstatusTramite.APROBADO:
        if tramite.tipo == TipoTramite.DESINCORPORACION:
            # En desuso cuando está desincorporado
            bien.estado = EstadoBien.EN_DESUSO
        elif tramite.tipo == TipoTramite.REASIGNACION:
            # En uso cuando está asignado activamente
            bien.estado = EstadoBien.EN_USO
            if decision.nuevo_responsable_id:
                bien.responsable_id = decision.nuevo_responsable_id
            if decision.nueva_ubicacion_id:
                bien.ubicacion_id = decision.nueva_ubicacion_id
        elif tramite.tipo == TipoTramite.PRESTAMO:
            bien.estado = EstadoBien.EN_USO
            if decision.nueva_ubicacion_id:
                bien.ubicacion_id = decision.nueva_ubicacion_id
        elif tramite.tipo == TipoTramite.INCORPORACION:
            bien.estado = EstadoBien.NUEVO

    session.add(bien)
    session.add(tramite)
    session.commit()
    session.refresh(tramite)
    return tramite
