from sqlmodel import Session, func, select
from app.models.entities import Bien


def generar_correlativo(session: Session) -> int:
    """
    Genera de manera automática el siguiente número correlativo patrimonial único.
    Ejemplo: 1, 2, 3 ... 28133
    """
    statement = select(func.max(Bien.correlativo))
    max_correlativo = session.exec(statement).one_or_none()

    if max_correlativo is None or max_correlativo == 0:
        return 1
    return max_correlativo + 1
