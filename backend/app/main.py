import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import engine
from app.core.seeder import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Asegurar que el directorio de uploads existe
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    try:
        seed_database()
    except Exception as e:
        print(f"Nota: No se pudo ejecutar el seeder inicial (posiblemente la BD aún no tiene tablas migradas): {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configuración de CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Servir archivos estáticos subidos (evidencias, informes técnicos)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Incluir Rutas de la API v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Salud"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
    }

