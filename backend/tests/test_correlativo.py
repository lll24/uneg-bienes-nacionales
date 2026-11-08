from sqlmodel import Session
from app.models.entities import Bien, Ubicacion, Usuario
from app.models.enums import EstadoBien, RolUsuario
from app.services.correlativo import generar_correlativo


def test_generar_correlativo_inicial(session: Session):
    """Verifica que el primer correlativo generado en una base de datos vacía sea 1."""
    next_corr = generar_correlativo(session)
    assert next_corr == 1


def test_generar_correlativo_secuencial(session: Session, test_users: dict, test_ubicacion: Ubicacion):
    """Verifica que el correlativo numérico se incremente de forma continua."""
    user = test_users[RolUsuario.RPU]["user"]

    # Insertar un primer bien con correlativo 500
    bien1 = Bien(
        correlativo=500,
        familia="EQUIPO DE PROC.DE DATOS",
        descripcion="Servidor Principal",
        estado=EstadoBien.NUEVO,
        ubicacion_id=test_ubicacion.id,
        responsable_id=user.id,
    )
    session.add(bien1)
    session.commit()

    # El siguiente debe ser 501
    assert generar_correlativo(session) == 501

    # Insertar bien 501
    bien2 = Bien(
        correlativo=501,
        familia="MOBILIARIO",
        descripcion="Silla Ergonómica",
        estado=EstadoBien.EN_USO,
        ubicacion_id=test_ubicacion.id,
        responsable_id=user.id,
    )
    session.add(bien2)
    session.commit()

    # El siguiente debe ser 502
    assert generar_correlativo(session) == 502

