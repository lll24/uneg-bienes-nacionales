from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import EstadoBien, OrigenIngreso
from app.schemas.ubicacion import UbicacionRead
from app.schemas.usuario import UsuarioRead


class BienBase(BaseModel):
    familia: str
    descripcion: str
    marca: Optional[str] = None
    modelo: Optional[str] = None
    serial: Optional[str] = None
    codigo_serie: Optional[str] = None

    # Único Estado Unificado del Bien
    estado: EstadoBien = EstadoBien.NUEVO

    # Modalidad y Origen de Entrada
    origen_ingreso: OrigenIngreso = OrigenIngreso.COMPRA

    # Documentos y Referencias según Origen
    orden_compra: Optional[str] = None
    numero_factura: Optional[str] = None
    fecha_adquisicion: Optional[date] = None  # Fecha de Factura
    documento_aprobacion: Optional[str] = None  # Carta de Aprobación para Donación u Otros
    url_documento_origen: Optional[str] = None  # Archivo escaneado adjunto

    # Datos Generales de Almacén
    fecha_recepcion: Optional[date] = None
    motivo: Optional[str] = None
    observaciones: Optional[str] = None

    # Contabilidad y Custodia
    codigo_contable: Optional[str] = None
    fecha_depreciacion: Optional[date] = None
    numero_ficha_responsable: Optional[str] = None
    ubicacion_id: int
    responsable_id: int


class BienCreate(BienBase):
    correlativo: Optional[int] = None  # Si se omite, el sistema autogenera el consecutivo numérico


class BienUpdate(BaseModel):
    familia: Optional[str] = None
    descripcion: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    serial: Optional[str] = None
    codigo_serie: Optional[str] = None
    estado: Optional[EstadoBien] = None
    origen_ingreso: Optional[OrigenIngreso] = None
    orden_compra: Optional[str] = None
    numero_factura: Optional[str] = None
    fecha_adquisicion: Optional[date] = None
    documento_aprobacion: Optional[str] = None
    url_documento_origen: Optional[str] = None
    fecha_recepcion: Optional[date] = None
    motivo: Optional[str] = None
    observaciones: Optional[str] = None
    codigo_contable: Optional[str] = None
    fecha_depreciacion: Optional[date] = None
    numero_ficha_responsable: Optional[str] = None
    ubicacion_id: Optional[int] = None
    responsable_id: Optional[int] = None


class BienRead(BienBase):
    id: int
    correlativo: int
    fecha_registro: datetime

    model_config = ConfigDict(from_attributes=True)


class BienWithDetails(BienRead):
    ubicacion: Optional[UbicacionRead] = None
    responsable: Optional[UsuarioRead] = None

    model_config = ConfigDict(from_attributes=True)
