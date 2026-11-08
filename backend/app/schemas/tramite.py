from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import EstatusTramite, TipoTramite
from app.schemas.usuario import UsuarioRead


class TramiteBase(BaseModel):
    tipo: TipoTramite
    bien_id: int
    motivo: Optional[str] = None
    url_evidencia_multimedia: Optional[str] = None


class TramiteCreate(TramiteBase):
    pass


class TramiteDecision(BaseModel):
    accion: EstatusTramite  # APROBADO o RECHAZADO
    observaciones: Optional[str] = None
    nuevo_responsable_id: Optional[int] = None  # Para reasignaciones
    nueva_ubicacion_id: Optional[int] = None    # Para reasignaciones o préstamos


class TramiteRead(TramiteBase):
    id: int
    solicitante_id: int
    fecha_solicitud: datetime
    estatus_tramite: str
    aprobado_por_id: Optional[int] = None
    fecha_resolucion: Optional[datetime] = None

    solicitante: Optional[UsuarioRead] = None
    aprobado_por: Optional[UsuarioRead] = None

    model_config = ConfigDict(from_attributes=True)

