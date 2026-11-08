from datetime import date, datetime, timezone
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import EstadoBien, OrigenIngreso, RolUsuario, TipoTramite


class Ubicacion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)

    bienes: List["Bien"] = Relationship(back_populates="ubicacion")


class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    cedula: str = Field(unique=True, index=True)
    rol: RolUsuario
    hashed_password: str = Field(default="")
    is_active: bool = Field(default=True)
    numero_ficha: Optional[str] = Field(default=None, index=True)

    bienes_a_cargo: List["Bien"] = Relationship(back_populates="responsable")


class Bien(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    correlativo: int = Field(unique=True, index=True)  # Número secuencial automático
    familia: str = Field(index=True)  # Una de las 19 familias oficiales UNEG (pueden ser mas)
    descripcion: str
    marca: Optional[str] = None
    modelo: Optional[str] = None
    serial: Optional[str] = None
    codigo_serie: Optional[str] = None

    # Único Estado Unificado del Bien
    estado: EstadoBien = Field(default=EstadoBien.NUEVO)

    # Modalidad y Origen de Entrada
    origen_ingreso: OrigenIngreso = Field(default=OrigenIngreso.COMPRA)
    
    # Documentos de Respaldo según el Origen:
    # 1. Compra
    orden_compra: Optional[str] = None
    numero_factura: Optional[str] = None
    fecha_adquisicion: Optional[date] = None  # Fecha de factura
    
    # 2. Donación u Otros (Carta de aprobación universitaria)
    documento_aprobacion: Optional[str] = None
    
    # Archivo digital de respaldo (Factura PDF, Carta de Aprobación, etc.)
    url_documento_origen: Optional[str] = None

    # Datos Generales de Almacén
    fecha_recepcion: Optional[date] = None
    fecha_registro: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    motivo: Optional[str] = None
    observaciones: Optional[str] = None

    # Contabilidad y Depreciación
    codigo_contable: Optional[str] = None
    fecha_depreciacion: Optional[date] = None

    # Custodia y Destinatario
    numero_ficha_responsable: Optional[str] = None
    ubicacion_id: int = Field(foreign_key="ubicacion.id")
    responsable_id: int = Field(foreign_key="usuario.id")

    # Relaciones
    ubicacion: Optional[Ubicacion] = Relationship(back_populates="bienes")
    responsable: Optional[Usuario] = Relationship(back_populates="bienes_a_cargo")
    tramites: List["Tramite"] = Relationship(back_populates="bien")


class Tramite(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    tipo: TipoTramite
    bien_id: int = Field(foreign_key="bien.id")
    solicitante_id: int = Field(foreign_key="usuario.id")
    fecha_solicitud: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    estatus_tramite: str = Field(default="Pendiente")
    url_evidencia_multimedia: Optional[str] = None  # Ruta al informe técnico en PDF o fotografía
    aprobado_por_id: Optional[int] = Field(default=None, foreign_key="usuario.id")
    motivo: Optional[str] = None
    fecha_resolucion: Optional[datetime] = None

    bien: Optional[Bien] = Relationship(back_populates="tramites")
    solicitante: Optional[Usuario] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "Tramite.solicitante_id"}
    )
    aprobado_por: Optional[Usuario] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "Tramite.aprobado_por_id"}
    )
