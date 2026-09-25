import pytest

def obtener_token(client, email="docente@utp.edu.pe", nombre="Profesor Demo"):
    res = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "nombre_completo": nombre
    })
    return res.json()["access_token"]

def test_actualizar_perfil_docente(client):
    token = obtener_token(client, "perfil@utp.edu.pe", "Nombre Inicial")
    headers = {"Authorization": f"Bearer {token}"}

    update_res = client.put("/api/docente/perfil", headers=headers, json={
        "nombre_completo": "Nombre Actualizado",
        "especialidad": "Arquitectura de Software"
    })
    assert update_res.status_code == 200
    assert update_res.json()["nombre_completo"] == "Nombre Actualizado"
    assert update_res.json()["especialidad"] == "Arquitectura de Software"

    pwd_res = client.put("/api/docente/perfil", headers=headers, json={
        "password_actual": "Password123!",
        "password_nuevo": "NuevaClave456!"
    })
    assert pwd_res.status_code == 200

    login_new = client.post("/api/auth/login", json={
        "email": "perfil@utp.edu.pe",
        "password": "NuevaClave456!"
    })
    assert login_new.status_code == 200

def test_crud_cursos_y_aislamiento_multidocente(client):
    token1 = obtener_token(client, "docente1@utp.edu.pe", "Docente 1")
    token2 = obtener_token(client, "docente2@utp.edu.pe", "Docente 2")
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    curso_data = {
        "codigo_seccion": "37651",
        "nombre_curso": "Calidad de Software",
        "periodo": "2026-2",
        "sesiones_semana": 2,
        "tiene_participacion": True,
        "tiene_tareas": True,
        "semana_corte": 4,
        "datos_alumnos": [
            {"id": "U20211001", "nombre": "Juan Pérez", "promedio_final": 16.5}
        ]
    }
    crear_res = client.post("/api/cursos", headers=headers1, json=curso_data)
    assert crear_res.status_code == 201
    curso_creado = crear_res.json()
    curso_id = curso_creado["id"]
    assert curso_creado["codigo_seccion"] == "37651"
    assert len(curso_creado["datos_alumnos"]) == 1

    listar1 = client.get("/api/cursos", headers=headers1)
    assert listar1.status_code == 200
    assert len(listar1.json()) == 1

    listar2 = client.get("/api/cursos", headers=headers2)
    assert listar2.status_code == 200
    assert len(listar2.json()) == 0

    get_ajeno = client.get(f"/api/cursos/{curso_id}", headers=headers2)
    assert get_ajeno.status_code == 404

    put_ajeno = client.put(f"/api/cursos/{curso_id}", headers=headers2, json={"nombre_curso": "Hack"})
    assert put_ajeno.status_code == 404

    put_propio = client.put(f"/api/cursos/{curso_id}", headers=headers1, json={"nombre_curso": "Calidad de Software Avanzada"})
    assert put_propio.status_code == 200
    assert put_propio.json()["nombre_curso"] == "Calidad de Software Avanzada"

    del_res = client.delete(f"/api/cursos/{curso_id}", headers=headers1)
    assert del_res.status_code == 204

    listar1_despues = client.get("/api/cursos", headers=headers1)
    assert len(listar1_despues.json()) == 0
