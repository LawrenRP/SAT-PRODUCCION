from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime

class DocenteBase(BaseModel):
    email: EmailStr
    nombre_completo: str = Field(..., min_length=3, max_length=150)
    institucion: str = Field(default="Universidad Tecnológica del Perú", max_length=100)
    especialidad: str = Field(default="Ingeniería de Software", max_length=100)

class DocenteResponse(DocenteBase):
    id: int
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)

class DocenteUpdate(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=3, max_length=150)
    institucion: Optional[str] = Field(None, max_length=100)
    especialidad: Optional[str] = Field(None, max_length=100)
    password_actual: Optional[str] = None
    password_nuevo: Optional[str] = Field(None, min_length=6)
