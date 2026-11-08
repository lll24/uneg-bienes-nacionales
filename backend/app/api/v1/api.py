from fastapi import APIRouter
from app.api.v1 import auth, bienes, tramites, ubicaciones, usuarios

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(usuarios.router)
api_router.include_router(ubicaciones.router)
api_router.include_router(bienes.router)
api_router.include_router(tramites.router)

