from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.docente import Docente
from backend.app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from backend.app.schemas.docente import DocenteResponse
from backend.app.core.security import hash_password, verify_password, create_access_token, get_current_docente

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def registrar_docente(payload: RegisterRequest, db: Session = Depends(get_db)):
    email_limpio = payload.email.lower().strip()
    
    docente_existente = db.query(Docente).filter(Docente.email == email_limpio).first()
    if docente_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una cuenta registrada con este correo electrónico."
        )
    
    nuevo_docente = Docente(
        email=email_limpio,
        hashed_password=hash_password(payload.password),
        nombre_completo=payload.nombre_completo.strip(),
        institucion=payload.institucion or "Universidad Tecnológica del Perú",
        especialidad=payload.especialidad or "Ingeniería de Software"
    )
    db.add(nuevo_docente)
    db.commit()
    db.refresh(nuevo_docente)
    
    token = create_access_token({"sub": str(nuevo_docente.id), "email": nuevo_docente.email})
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        docente=DocenteResponse.model_validate(nuevo_docente)
    )

@router.post("/login", response_model=AuthResponse)
def iniciar_sesion(payload: LoginRequest, db: Session = Depends(get_db)):
    email_limpio = payload.email.lower().strip()
    docente = db.query(Docente).filter(Docente.email == email_limpio).first()
    
    if not docente or not verify_password(payload.password, docente.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = create_access_token({"sub": str(docente.id), "email": docente.email})
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        docente=DocenteResponse.model_validate(docente)
    )

@router.get("/me", response_model=DocenteResponse)
def obtener_perfil_activo(current_docente: Docente = Depends(get_current_docente)):
    return DocenteResponse.model_validate(current_docente)
