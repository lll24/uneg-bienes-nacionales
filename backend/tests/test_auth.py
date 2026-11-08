from fastapi.testclient import TestClient
from sqlmodel import Session
from app.core.security import get_password_hash, verify_password
from app.models.enums import RolUsuario


def test_password_hashing():
    password = "SuperPassword123!"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_login_success(client: TestClient, test_users: dict):
    # Probar login con el usuario Administrador
    admin_info = test_users[RolUsuario.ADMINISTRADOR]
    response = client.post(
        "/api/v1/auth/login",
        json={"cedula": admin_info["user"].cedula, "password": "TestPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["rol"] == RolUsuario.ADMINISTRADOR.value
    assert data["cedula"] == admin_info["user"].cedula


def test_login_invalid_password(client: TestClient, test_users: dict):
    admin_info = test_users[RolUsuario.ADMINISTRADOR]
    response = client.post(
        "/api/v1/auth/login",
        json={"cedula": admin_info["user"].cedula, "password": "ClaveIncorrecta!"},
    )
    assert response.status_code == 401
    assert "incorrecta" in response.json()["detail"].lower()


def test_read_me_authenticated(client: TestClient, test_users: dict):
    jefe_info = test_users[RolUsuario.JEFE]
    response = client.get("/api/v1/auth/me", headers=jefe_info["headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["cedula"] == jefe_info["user"].cedula
    assert data["rol"] == RolUsuario.JEFE.value


def test_read_me_unauthorized(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

