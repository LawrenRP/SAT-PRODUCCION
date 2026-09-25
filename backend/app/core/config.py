from typing import Optional
import os

class Settings:
    PROJECT_NAME: str = "Sistema de Alerta Temprana (EWS) - UTP"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "utp_ews_production_super_secret_key_2026_glados_backend_secure_token_512")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ews.db")
    
    @property
    def sync_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg2://", 1)
        if url.startswith("postgresql://") and not url.startswith("postgresql+"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

settings = Settings()
