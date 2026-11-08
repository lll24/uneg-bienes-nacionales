import io
from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models.entities import Bien, Ubicacion
from app.models.enums import EstadoBien, EstatusTramite, RolUsuario, TipoTramite


def test_documentalista_create_desincorporacion(
    client: TestClient, test_users: dict, test_bien: Bien
):
    """Verifica que el Documentalista pueda iniciar un trámite de desincorporación técnica."""
    doc = test_users[RolUsuario.DOCUMENTALISTA]

    payload = {
        "tipo": "Desincorporación",
        "bien_id": test_bien.id,
        "motivo": "Informe Técnico N° 01: Avería irreparable en circuito de alimentación.",
        "url_evidencia_multimedia": "/uploads/informe_tecnico_test.pdf",
    }

    response = client.post(
        "/api/v1/tramites", json=payload, headers=doc["headers"]
    )
    assert response.status_code == 201
    data = response.json()
    assert data["tipo"] == "Desincorporación"
    assert data["estatus_tramite"] == "Pendiente"
    assert data["solicitante_id"] == doc["user"].id


def test_jefe_approve_desincorporacion(
    client: TestClient, test_users: dict, test_bien: Bien, session: Session
):
    """
    Verifica que el Jefe dé el clic de aprobación final a una desincorporación,
    provocando que el bien pase a estatus Desincorporado.
    """
    doc = test_users[RolUsuario.DOCUMENTALISTA]
    jefe = test_users[RolUsuario.JEFE]

    # 1. Crear el trámite como Documentalista
    res_crear = client.post(
        "/api/v1/tramites",
        json={
            "tipo": "Desincorporación",
            "bien_id": test_bien.id,
            "motivo": "Obsolescencia insubsanable.",
        },
        headers=doc["headers"],
    )
    tramite_id = res_crear.json()["id"]

    # 2. El Jefe aprueba la desincorporación
    decision_payload = {
        "accion": "Aprobado",
        "observaciones": "Aprobada la baja patrimonial con informe técnico.",
    }
    res_decidir = client.post(
        "/api/v1/tramites/{0}/decidir".format(tramite_id),
        json=decision_payload,
        headers=jefe["headers"],
    )
    assert res_decidir.status_code == 200
    assert res_decidir.json()["estatus_tramite"] == "Aprobado"
    assert res_decidir.json()["aprobado_por_id"] == jefe["user"].id

    # 3. Verificar que el estado del Bien cambió a En desuso (Desincorporado)
    session.refresh(test_bien)
    assert test_bien.estado == EstadoBien.EN_DESUSO


def test_jefe_approve_reasignacion(
    client: TestClient,
    test_users: dict,
    test_bien: Bien,
    test_ubicacion: Ubicacion,
    session: Session,
):
    """
    Verifica que el Jefe apruebe una Reasignación, actualizando el custodio
    responsable y la nueva ubicación física del bien.
    """
    rpu = test_users[RolUsuario.RPU]
    jefe = test_users[RolUsuario.JEFE]
    nuevo_custodio = test_users[RolUsuario.REGISTRADOR]["user"]

    # 1. Crear solicitud de reasignación
    res_crear = client.post(
        "/api/v1/tramites",
        json={
            "tipo": "Reasignación",
            "bien_id": test_bien.id,
            "motivo": "Transferencia de equipo por necesidad de servicio.",
        },
        headers=rpu["headers"],
    )
    tramite_id = res_crear.json()["id"]

    # 2. El Jefe aprueba la reasignación asignando el nuevo custodio
    res_decidir = client.post(
        "/api/v1/tramites/{0}/decidir".format(tramite_id),
        json={
            "accion": "Aprobado",
            "observaciones": "Autorizado por Jefatura.",
            "nuevo_responsable_id": nuevo_custodio.id,
        },
        headers=jefe["headers"],
    )
    assert res_decidir.status_code == 200

    # 3. Verificar que el bien cambió de custodio y su estado es En uso
    session.refresh(test_bien)
    assert test_bien.responsable_id == nuevo_custodio.id
    assert test_bien.estado == EstadoBien.EN_USO


def test_registrador_cannot_approve_desincorporacion(
    client: TestClient, test_users: dict, test_bien: Bien
):
    """Verifica que un Registrador no pueda usurpar la función del Jefe aprobando una desincorporación."""
    doc = test_users[RolUsuario.DOCUMENTALISTA]
    registrador = test_users[RolUsuario.REGISTRADOR]

    res_crear = client.post(
        "/api/v1/tramites",
        json={
            "tipo": "Desincorporación",
            "bien_id": test_bien.id,
            "motivo": "Prueba de permisos RBAC.",
        },
        headers=doc["headers"],
    )
    tramite_id = res_crear.json()["id"]

    res_decidir = client.post(
        "/api/v1/tramites/{0}/decidir".format(tramite_id),
        json={"accion": "Aprobado"},
        headers=registrador["headers"],
    )
    assert res_decidir.status_code == 403


def test_upload_evidencia_multimedia(client: TestClient, test_users: dict):
    """Verifica que el Documentalista pueda subir un archivo PDF o imagen de informe técnico."""
    doc = test_users[RolUsuario.DOCUMENTALISTA]

    fake_file = io.BytesIO(b"%PDF-1.4 Fake PDF Technical Report Content")
    files = {"file": ("informe_tecnico_uneg.pdf", fake_file, "application/pdf")}

    response = client.post(
        "/api/v1/tramites/evidencia",
        files=files,
        headers=doc["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert "url_evidencia_multimedia" in data
    assert data["url_evidencia_multimedia"].startswith("/uploads/")
    assert data["nombre_original"] == "informe_tecnico_uneg.pdf"
