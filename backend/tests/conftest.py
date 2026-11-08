import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.api.deps import get_session
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models.entities import Bien, Ubicacion, Usuario
from app.models.enums import EstadoBien, OrigenIngreso, RolUsuario

# Motor en memoria SQLite aislado para pruebas automatizadas
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        yield session
    SQLModel.metadata.drop_all(test_engine)


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_users")
def test_users_fixture(session: Session) -> dict:
    """Crea un usuario para cada uno de los 6 roles en la base de datos de pruebas."""
    roles = [
        (RolUsuario.ADMINISTRADOR, "V-10000001", "Admin Test"),
        (RolUsuario.JEFE, "V-10000002", "Jefe Test"),
        (RolUsuario.REGISTRADOR, "V-10000003", "Registrador Test"),
        (RolUsuario.DOCUMENTALISTA, "V-10000004", "Documentalista Test"),
        (RolUsuario.AUDITOR, "V-10000005", "Auditor Test"),
        (RolUsuario.RPU, "V-10000006", "RPU Test"),
    ]

    created = {}
    for rol, cedula, nombre in roles:
        user = Usuario(
            nombre=nombre,
            cedula=cedula,
            rol=rol,
            hashed_password=get_password_hash("TestPass123!"),
            is_active=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        token = create_access_token(
            subject=user.cedula,
            extra_claims={"rol": user.rol.value, "nombre": user.nombre},
        )
        created[rol] = {
            "user": user,
            "token": token,
            "headers": {"Authorization": f"Bearer {token}"},
        }

    return created


@pytest.fixture(name="test_ubicacion")
def test_ubicacion_fixture(session: Session) -> Ubicacion:
    ubicacion = Ubicacion(nombre="Laboratorio de Pruebas UNEG")
    session.add(ubicacion)
    session.commit()
    session.refresh(ubicacion)
    return ubicacion


@pytest.fixture(name="test_bien")
def test_bien_fixture(session: Session, test_users: dict, test_ubicacion: Ubicacion) -> Bien:
    bien = Bien(
        correlativo=1,
        familia="EQUIPO DE PROC.DE DATOS",
        descripcion="Computador de prueba automatizada",
        marca="TestBrand",
        modelo="TestModel",
        serial="SN-TEST-123",
        codigo_serie="SERIE-TEST-01",
        estado=EstadoBien.EN_USO,
        origen_ingreso=OrigenIngreso.COMPRA,
        orden_compra="OC-TEST-001",
        numero_factura="FAC-TEST-01",
        codigo_contable="1.2.3.01.05",
        numero_ficha_responsable="RPU-TEST",
        ubicacion_id=test_ubicacion.id,
        responsable_id=test_users[RolUsuario.RPU]["user"].id,
    )
    session.add(bien)
    session.commit()
    session.refresh(bien)
    return bien

