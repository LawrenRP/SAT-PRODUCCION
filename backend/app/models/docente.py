from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class Docente(Base):
    __tablename__ = "docentes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    nombre_completo = Column(String(150), nullable=False)
    institucion = Column(String(100), default="Universidad Tecnológica del Perú", nullable=False)
    especialidad = Column(String(100), default="Ingeniería de Software", nullable=False)
    creado_en = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    cursos = relationship("Curso", back_populates="docente", cascade="all, delete-orphan")
