from fastapi.testclient import TestClient
from app.models.entities import Ubicacion
from app.models.enums import EstadoBien, RolUsuario


def test_create_bien_by_registrador(
    client: TestClient, test_users: dict, test_ubicacion: Ubicacion
):
    """Verifica que el Registrador pueda dar de alta un bien con correlativo automático y estado de almacén."""
    registrador = test_users[RolUsuario.REGISTRADOR]
    rpu = test_users[RolUsuario.RPU]["user"]

    payload = {
        "familia": "EQUIPO DE PROC.DE DATOS",
        "descripcion": "Computador All in One para Laboratorio",
        "marca": "Lenovo",
        "modelo": "ThinkCentre",
        "serial": "SN-LNV-0981",
        "estado": "Nuevo",
        "origen_ingreso": "Compra",
        "orden_compra": "OC-2024-5501",
        "numero_factura": "FAC-2024-0012",
        "fecha_adquisicion": "2024-03-01",
        "fecha_recepcion": "2024-03-05",
        "codigo_contable": "1.2.3.01.05",
        "ubicacion_id": test_ubicacion.id,
        "responsable_id": rpu.id,
    }

    response = client.post(
        "/api/v1/bienes", json=payload, headers=registrador["headers"]
    )
    assert response.status_code == 201
    data = response.json()
    assert data["correlativo"] >= 1
    assert data["descripcion"] == payload["descripcion"]
    assert data["estado"] == "Nuevo"
    assert data["orden_compra"] == "OC-2024-5501"


def test_create_bien_forbidden_for_rpu(
    client: TestClient, test_users: dict, test_ubicacion: Ubicacion
):
    """Verifica que un RPU no tenga permiso para registrar bienes directamente."""
    rpu = test_users[RolUsuario.RPU]

    payload = {
        "familia": "MOBILIARIO",
        "descripcion": "Silla ejecutiva",
        "ubicacion_id": test_ubicacion.id,
        "responsable_id": rpu["user"].id,
    }

    response = client.post("/api/v1/bienes", json=payload, headers=rpu["headers"])
    assert response.status_code == 403


def test_list_bienes_filter_estado(
    client: TestClient, test_users: dict, test_bien
):
    registrador = test_users[RolUsuario.REGISTRADOR]

    response = client.get(
        "/api/v1/bienes?estado=En uso", headers=registrador["headers"]
    )
    assert response.status_code == 200
    bienes = response.json()
    assert len(bienes) >= 1
    assert all(b["estado"] == "En uso" for b in bienes)


def test_auditoria_reporte_permisos(client: TestClient, test_users: dict, test_bien):
    """Verifica que el Auditor tenga acceso al reporte por responsable y un RPU no."""
    auditor = test_users[RolUsuario.AUDITOR]
    rpu = test_users[RolUsuario.RPU]

    # Auditor autorizado
    res_auditor = client.get(
        "/api/v1/bienes/auditoria/reporte-por-responsable",
        headers=auditor["headers"],
    )
    assert res_auditor.status_code == 200
    assert "data" in res_auditor.json()

    # RPU no autorizado para este reporte general de auditoría
    res_rpu = client.get(
        "/api/v1/bienes/auditoria/reporte-por-responsable", headers=rpu["headers"]
    )
    assert res_rpu.status_code == 403

