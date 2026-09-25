import pytest

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "UTP" in data["app"]

def test_registrar_docente_exitoso(client):
    payload = {
        "email": "docente.prueba@utp.edu.pe",
        "password": "Password123!",
        "nombre_completo": "Prof. Alan Turing",
        "institucion": "Universidad Tecnológica del Perú",
        "especialidad": "Ingeniería de Software"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["docente"]["email"] == "docente.prueba@utp.edu.pe"
    assert data["docente"]["nombre_completo"] == "Prof. Alan Turing"
    assert "password" not in data["docente"]

def test_registrar_docente_email_duplicado(client):
    payload = {
        "email": "repetido@utp.edu.pe",
        "password": "Password123!",
        "nombre_completo": "Prof. Ada Lovelace"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "Ya existe una cuenta" in res2.json()["detail"]

def test_login_exitoso_y_me(client):
    client.post("/api/auth/register", json={
        "email": "login.test@utp.edu.pe",
        "password": "SecretPassword123",
        "nombre_completo": "Prof. Linus Torvalds"
    })

    login_res = client.post("/api/auth/login", json={
        "email": "login.test@utp.edu.pe",
        "password": "SecretPassword123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["nombre_completo"] == "Prof. Linus Torvalds"
    assert me_data["email"] == "login.test@utp.edu.pe"

def test_login_credenciales_invalidas(client):
    client.post("/api/auth/register", json={
        "email": "seguridad@utp.edu.pe",
        "password": "CorrectPassword",
        "nombre_completo": "Docente Seguro"
    })

    res = client.post("/api/auth/login", json={
        "email": "seguridad@utp.edu.pe",
        "password": "WrongPassword"
    })
    assert res.status_code == 401
    assert "incorrectos" in res.json()["detail"]

def test_registro_password_demasiado_corto(client):
    res = client.post("/api/auth/register", json={
        "email": "corto@utp.edu.pe",
        "password": "123",
        "nombre_completo": "Docente Clave Corta"
    })
    assert res.status_code == 422

def test_acceso_recurso_protegido_sin_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401

def test_token_malformado(client):
    headers = {"Authorization": "Bearer token_falso_invalido_xyz"}
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 401
