from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.docente import Docente
from backend.app.schemas.docente import DocenteResponse, DocenteUpdate
from backend.app.core.security import get_current_docente, hash_password, verify_password

router = APIRouter(prefix="/docente", tags=["Perfil Docente"])

@router.put("/perfil", response_model=DocenteResponse)
def actualizar_perfil(
    payload: DocenteUpdate,
    db: Session = Depends(get_db),
    current_docente: Docente = Depends(get_current_docente)
):
    if payload.nombre_completo is not None:
        current_docente.nombre_completo = payload.nombre_completo.strip()
    if payload.institucion is not None:
        current_docente.institucion = payload.institucion.strip()
    if payload.especialidad is not None:
        current_docente.especialidad = payload.especialidad.strip()
        
    if payload.password_nuevo:
        if not payload.password_actual:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe ingresar su contraseña actual para establecer una nueva."
            )
        if not verify_password(payload.password_actual, current_docente.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual ingresada es incorrecta."
            )
        current_docente.hashed_password = hash_password(payload.password_nuevo)

    db.add(current_docente)
    db.commit()
    db.refresh(current_docente)
    
    return DocenteResponse.model_validate(current_docente)
