from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from backend.app.schemas.docente import DocenteResponse

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    nombre_completo: str = Field(..., min_length=3, max_length=150)
    institucion: Optional[str] = "Universidad Tecnológica del Perú"
    especialidad: Optional[str] = "Ingeniería de Software"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    docente: DocenteResponse
