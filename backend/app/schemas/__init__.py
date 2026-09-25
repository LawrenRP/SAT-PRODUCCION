from backend.app.schemas.auth import RegisterRequest, LoginRequest, Token, TokenPayload, AuthResponse
from backend.app.schemas.docente import DocenteBase, DocenteResponse, DocenteUpdate
from backend.app.schemas.curso import CursoBase, CursoCreate, CursoUpdate, CursoResponse

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "Token",
    "TokenPayload",
    "AuthResponse",
    "DocenteBase",
    "DocenteResponse",
    "DocenteUpdate",
    "CursoBase",
    "CursoCreate",
    "CursoUpdate",
    "CursoResponse",
]
