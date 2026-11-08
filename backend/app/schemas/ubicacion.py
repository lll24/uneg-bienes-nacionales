from typing import Optional
from pydantic import BaseModel, ConfigDict


class UbicacionBase(BaseModel):
    nombre: str


class UbicacionCreate(UbicacionBase):
    pass


class UbicacionUpdate(BaseModel):
    nombre: Optional[str] = None


class UbicacionRead(UbicacionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

