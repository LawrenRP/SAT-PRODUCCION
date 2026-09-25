from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.db.session import get_db
from backend.app.models.docente import Docente
from backend.app.models.curso import Curso
from backend.app.schemas.curso import CursoCreate, CursoUpdate, CursoResponse
from backend.app.core.security import get_current_docente

router = APIRouter(prefix="/cursos", tags=["Cursos"])

@router.get("", response_model=List[CursoResponse])
def listar_cursos_docente(
    db: Session = Depends(get_db),
    current_docente: Docente = Depends(get_current_docente)
):
    cursos = (
        db.query(Curso)
        .filter(Curso.docente_id == current_docente.id)
        .order_by(Curso.actualizado_en.desc())
        .all()
    )
    return [CursoResponse.model_validate(c) for c in cursos]

@router.get("/{curso_id}", response_model=CursoResponse)
def obtener_curso(
    curso_id: int,
    db: Session = Depends(get_db),
    current_docente: Docente = Depends(get_current_docente)
):
    curso = (
        db.query(Curso)
        .filter(Curso.id == curso_id, Curso.docente_id == current_docente.id)
        .first()
    )
    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Curso con ID {curso_id} no encontrado o no pertenece a su usuario."
        )
    return CursoResponse.model_validate(curso)

@router.post("", response_model=CursoResponse, status_code=status.HTTP_201_CREATED)
def crear_curso(
    payload: CursoCreate,
    db: Session = Depends(get_db),
    current_docente: Docente = Depends(get_current_docente)
):
    nuevo_curso = Curso(
        docente_id=current_docente.id,
        codigo_seccion=payload.codigo_seccion.strip(),
        nombre_curso=payload.nombre_curso.strip(),
        periodo=payload.periodo,
        sesiones_semana=payload.sesiones_semana,
        tiene_participacion=payload.tiene_participacion,
        tiene_tareas=payload.tiene_tareas,
        semana_corte=payload.semana_corte,
        datos_alumnos=payload.datos_alumnos
    )
    db.add(nuevo_curso)
    db.commit()
    db.refresh(nuevo_curso)
    return CursoResponse.model_validate(nuevo_curso)

@router.put("/{curso_id}", response_model=CursoResponse)
def actualizar_curso(
    curso_id: int,
    payload: CursoUpdate,
    db: Session = Depends(get_db),
    current_docente: Docente = Depends(get_current_docente)
):
    curso = (
        db.query(Curso)
        .filter(Curso.id == curso_id, Curso.docente_id == current_docente.id)
        .first()
    )
    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Curso con ID {curso_id} no encontrado o no pertenece a su usuario."
        )

    if payload.codigo_seccion is not None:
        curso.codigo_seccion = payload.codigo_seccion.strip()
    if payload.nombre_curso is not None:
        curso.nombre_curso = payload.nombre_curso.strip()
    if payload.periodo is not None:
        curso.periodo = payload.periodo
    if payload.sesiones_semana is not None:
        curso.sesiones_semana = payload.sesiones_semana
    if payload.tiene_participacion is not None:
        curso.tiene_participacion = payload.tiene_participacion
    if payload.tiene_tareas is not None:
        curso.tiene_tareas = payload.tiene_tareas
    if payload.semana_corte is not None:
        curso.semana_corte = payload.semana_corte
    if payload.datos_alumnos is not None:
        curso.datos_alumnos = payload.datos_alumnos

    db.add(curso)
    db.commit()
    db.refresh(curso)
    return CursoResponse.model_validate(curso)

@router.delete("/{curso_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_curso(
    curso_id: int,
    db: Session = Depends(get_db),
    current_docente: Docente = Depends(get_current_docente)
):
    curso = (
        db.query(Curso)
        .filter(Curso.id == curso_id, Curso.docente_id == current_docente.id)
        .first()
    )
    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Curso con ID {curso_id} no encontrado o no pertenece a su usuario."
        )

    db.delete(curso)
    db.commit()
    return None
