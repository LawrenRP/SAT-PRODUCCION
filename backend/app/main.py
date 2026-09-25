from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from backend.app.core.config import settings
from backend.app.db.session import engine, Base
import backend.app.models
from backend.app.routers import auth, docente, cursos

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API institucional para el Sistema de Alerta Temprana en Docencia Universitaria (EWS) - UTP",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(docente.router, prefix=settings.API_V1_STR)
app.include_router(cursos.router, prefix=settings.API_V1_STR)

@app.get("/api/health", tags=["Salud"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql"
    }

web_dir = Path(__file__).resolve().parent.parent.parent / "web"
if web_dir.exists() and web_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(web_dir), html=True), name="static")
