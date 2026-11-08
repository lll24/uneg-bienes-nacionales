from app.schemas.token import Token, TokenPayload
from app.schemas.usuario import LoginRequest, UsuarioBase, UsuarioCreate, UsuarioRead, UsuarioUpdate
from app.schemas.ubicacion import UbicacionBase, UbicacionCreate, UbicacionRead, UbicacionUpdate
from app.schemas.bien import BienBase, BienCreate, BienRead, BienUpdate, BienWithDetails
from app.schemas.tramite import TramiteBase, TramiteCreate, TramiteDecision, TramiteRead

__all__ = [
    "Token",
    "TokenPayload",
    "LoginRequest",
    "UsuarioBase",
    "UsuarioCreate",
    "UsuarioRead",
    "UsuarioUpdate",
    "UbicacionBase",
    "UbicacionCreate",
    "UbicacionRead",
    "UbicacionUpdate",
    "BienBase",
    "BienCreate",
    "BienRead",
    "BienUpdate",
    "BienWithDetails",
    "TramiteBase",
    "TramiteCreate",
    "TramiteDecision",
    "TramiteRead",
]

