from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    docente_id = Column(Integer, ForeignKey("docentes.id", ondelete="CASCADE"), nullable=False, index=True)
    codigo_seccion = Column(String(50), nullable=False)
    nombre_curso = Column(String(150), nullable=False)
    periodo = Column(String(50), default="2026-2", nullable=False)
    sesiones_semana = Column(Integer, default=2, nullable=False)
    tiene_participacion = Column(Boolean, default=True, nullable=False)
    tiene_tareas = Column(Boolean, default=True, nullable=False)
    semana_corte = Column(Integer, default=4, nullable=False)
    datos_alumnos = Column(Text, default="[]", nullable=False)
    creado_en = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    actualizado_en = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    docente = relationship("Docente", back_populates="cursos")
