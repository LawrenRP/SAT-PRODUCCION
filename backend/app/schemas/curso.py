import json
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, Union, Any, List
from datetime import datetime

class CursoBase(BaseModel):
    codigo_seccion: str = Field(..., min_length=1, max_length=50)
    nombre_curso: str = Field(..., min_length=1, max_length=150)
    periodo: str = Field(default="2026-2", max_length=50)
    sesiones_semana: int = Field(default=2, ge=1, le=2)
    tiene_participacion: bool = Field(default=True)
    tiene_tareas: bool = Field(default=True)
    semana_corte: int = Field(default=4, ge=1, le=18)

class CursoCreate(CursoBase):
    datos_alumnos: Optional[Union[str, List[Any]]] = []

    @field_validator("datos_alumnos", mode="before")
    @classmethod
    def normalizar_datos(cls, v):
        if isinstance(v, (list, dict)):
            return json.dumps(v, ensure_ascii=False)
        return v or "[]"

class CursoUpdate(BaseModel):
    codigo_seccion: Optional[str] = Field(None, min_length=1, max_length=50)
    nombre_curso: Optional[str] = Field(None, min_length=1, max_length=150)
    periodo: Optional[str] = None
    sesiones_semana: Optional[int] = Field(None, ge=1, le=2)
    tiene_participacion: Optional[bool] = None
    tiene_tareas: Optional[bool] = None
    semana_corte: Optional[int] = Field(None, ge=1, le=18)
    datos_alumnos: Optional[Union[str, List[Any]]] = None

    @field_validator("datos_alumnos", mode="before")
    @classmethod
    def normalizar_datos_update(cls, v):
        if v is not None and isinstance(v, (list, dict)):
            return json.dumps(v, ensure_ascii=False)
        return v

class CursoResponse(CursoBase):
    id: int
    docente_id: int
    datos_alumnos: Any
    creado_en: datetime
    actualizado_en: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("datos_alumnos", mode="before")
    @classmethod
    def parsear_datos(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v
