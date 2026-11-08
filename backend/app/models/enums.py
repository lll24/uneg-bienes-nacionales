from enum import Enum


class RolUsuario(str, Enum):
    JEFE = "Jefe"
    ADMINISTRADOR = "Administrador"
    REGISTRADOR = "Registrador"
    DOCUMENTALISTA = "Documentalista"
    AUDITOR = "Auditor"
    RPU = "Responsable de Unidad"


class OrigenIngreso(str, Enum):
    COMPRA = "Compra"
    DONACION = "Donación"
    FABRICACION = "Fabricación"
    OTROS = "Otros"


class EstadoBien(str, Enum):
    # En Almacén
    NUEVO = "Nuevo"
    BUEN_ESTADO = "Buen estado"
    REGULAR = "Regular"
    DETERIORADO = "Deteriorado"
    INSERVIBLE = "Inservible"
    # En operación / custodia
    EN_USO = "En uso"
    # En taller / reparación
    EN_MANTENIMIENTO = "En mantenimiento"
    # Desincorporado / dado de baja
    EN_DESUSO = "En desuso"


class TipoTramite(str, Enum):
    INCORPORACION = "Incorporación"
    REASIGNACION = "Reasignación"
    PRESTAMO = "Préstamo"
    DESINCORPORACION = "Desincorporación"


class EstatusTramite(str, Enum):
    PENDIENTE = "Pendiente"
    APROBADO = "Aprobado"
    RECHAZADO = "Rechazado"


# 19 Familias Oficiales extraídas del inventario patrimonial UNEG
FAMILIAS_UNEG = [
    "EDIFICIOS E INSTALACIONES",
    "EQUIPO CIENTIFICO Y DE LABORATORIO",
    "EQUIPO DE DEPORTE, MUSICA Y RECREACION",
    "EQUIPO DE ENERGIA",
    "EQUIPO DE OFICINA Y OTROS",
    "EQUIPO DE PROC.DE DATOS",
    "EQUIPO DE SEGURIDAD",
    "EQUIPOS DE ACONDICIONAMIENTO DE AIRE",
    "EQUIPOS DE AUDIO Y VIDEO",
    "EQUIPOS DE COMUNICACION",
    "EQUIPOS MEDICOS QUIRURGICOS, VETERINARIO",
    "INSTRUMENTOS MUSICALES",
    "MAQ.DE ARTES GRAFICAS",
    "MAQUINA PARA INDUSTRIA DE LA MADERA",
    "MAQUINA Y EQUIPO DE TALLER AUTOMOTOR",
    "MAQUINARIAS Y EQUIPOS AGRICOLAS Y PECUAR",
    "MOBILIARIO",
    "OBRAS DE ARTES",
    "VEHICULOS",
]
