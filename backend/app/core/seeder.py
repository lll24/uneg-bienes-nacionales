from datetime import date, datetime, timezone
from sqlmodel import Session, select
from app.core.database import engine
from app.core.security import get_password_hash
from app.models.entities import Bien, Tramite, Ubicacion, Usuario
from app.models.enums import EstadoBien, EstatusTramite, OrigenIngreso, RolUsuario, TipoTramite


def seed_database(session: Session = None):
    """
    Pobla la base de datos con datos institucionales UNEG:
    - 6 usuarios representando cada uno de los roles RBAC con número de ficha.
    - Ubicaciones oficiales de campus.
    - Bienes patrimoniales con las familias oficiales y correlativos numéricos.
    - Estado unificado: En Almacén (Nuevo, Buen estado, Regular, Deteriorado, Inservible), En uso, En mantenimiento, En desuso.
    """
    def _seed(s: Session):
        # 1. Semilla de Ubicaciones
        ubicaciones_base = [
            "Almacén Central de Bienes Nacionales (Campus Atlántico)",
            "Laboratorio de Redes y Telemática (Edif. General Piso 2)",
            "Departamento de Informática y Sistemas (Campus Puerto Ordaz)",
            "Decanato de Investigación y Postgrado (Edif. Administrativo)",
        ]

        ubicacion_map = {}
        for nom in ubicaciones_base:
            u = s.exec(select(Ubicacion).where(Ubicacion.nombre == nom)).first()
            if not u:
                u = Ubicacion(nombre=nom)
                s.add(u)
                s.commit()
                s.refresh(u)
            ubicacion_map[nom] = u

        # 2. Semilla de Usuarios (1 por cada rol RBAC con número de ficha)
        usuarios_data = [
            {
                "cedula": "V-00000001",
                "nombre": "Administrador General UNEG",
                "rol": RolUsuario.ADMINISTRADOR,
                "password": "Admin1234!",
                "numero_ficha": "ADM-001",
            },
            {
                "cedula": "V-00000002",
                "nombre": "Prof. Roberto Méndez (Jefe de Bienes)",
                "rol": RolUsuario.JEFE,
                "password": "Jefe1234!",
                "numero_ficha": "JEF-002",
            },
            {
                "cedula": "V-00000003",
                "nombre": "Lcdo. Marcos Registrador (Control Perceptivo)",
                "rol": RolUsuario.REGISTRADOR,
                "password": "Reg1234!",
                "numero_ficha": "REG-003",
            },
            {
                "cedula": "V-00000004",
                "nombre": "Lcda. Elena Documentalista (Expedientes Técnicos)",
                "rol": RolUsuario.DOCUMENTALISTA,
                "password": "Doc1234!",
                "numero_ficha": "DOC-004",
            },
            {
                "cedula": "V-00000005",
                "nombre": "Ing. Valeria Auditora (Fiscalización)",
                "rol": RolUsuario.AUDITOR,
                "password": "Aud1234!",
                "numero_ficha": "AUD-005",
            },
            {
                "cedula": "V-00000006",
                "nombre": "Prof. Carlos Mendoza (RPU - Informática)",
                "rol": RolUsuario.RPU,
                "password": "Rpu1234!",
                "numero_ficha": "PROF-1092",
            },
        ]

        user_map = {}
        for udata in usuarios_data:
            user = s.exec(select(Usuario).where(Usuario.cedula == udata["cedula"])).first()
            if not user:
                user = Usuario(
                    nombre=udata["nombre"],
                    cedula=udata["cedula"],
                    rol=udata["rol"],
                    hashed_password=get_password_hash(udata["password"]),
                    is_active=True,
                    numero_ficha=udata["numero_ficha"],
                )
                s.add(user)
                s.commit()
                s.refresh(user)
            user_map[udata["rol"]] = user

        # 3. Semilla de Bienes con estado unificado y origen de ingreso
        bienes_data = [
            {
                "correlativo": 1001,
                "familia": "EQUIPO DE PROC.DE DATOS",
                "descripcion": "Estación de Trabajo Dell OptiPlex 7090, Core i7, 16GB RAM, 512GB SSD",
                "marca": "Dell",
                "modelo": "OptiPlex 7090",
                "serial": "SN-DELL-90214",
                "codigo_serie": "LOT-2023-A",
                "estado": EstadoBien.EN_USO,  # En uso asignado al profesor
                "origen_ingreso": OrigenIngreso.COMPRA,
                "orden_compra": "OC-2023-0452",
                "numero_factura": "FAC-9921",
                "fecha_recepcion": date(2023, 6, 15),
                "fecha_adquisicion": date(2023, 6, 10),
                "codigo_contable": "1.2.3.01.05",
                "numero_ficha_responsable": "PROF-1092",
                "ubicacion_id": ubicacion_map["Laboratorio de Redes y Telemática (Edif. General Piso 2)"].id,
                "responsable_id": user_map[RolUsuario.RPU].id,
            },
            {
                "correlativo": 1002,
                "familia": "EQUIPO DE PROC.DE DATOS",
                "descripcion": "Servidor en Rack PowerEdge R740 32GB RAM 2TB SAS",
                "marca": "Dell",
                "modelo": "PowerEdge R740",
                "serial": "SN-SRV-88392",
                "codigo_serie": "LOT-2024-B",
                "estado": EstadoBien.NUEVO,  # En Almacén recién llegado
                "origen_ingreso": OrigenIngreso.COMPRA,
                "orden_compra": "OC-2024-0108",
                "numero_factura": "FAC-10023",
                "fecha_recepcion": date(2024, 2, 20),
                "fecha_adquisicion": date(2024, 2, 12),
                "codigo_contable": "1.2.3.01.05",
                "numero_ficha_responsable": "ADM-001",
                "ubicacion_id": ubicacion_map["Almacén Central de Bienes Nacionales (Campus Atlántico)"].id,
                "responsable_id": user_map[RolUsuario.ADMINISTRADOR].id,
            },
            {
                "correlativo": 1003,
                "familia": "MOBILIARIO",
                "descripcion": "Escritorio ejecutivo modular en L con gavetero metálico de tres niveles",
                "marca": "ModuForm",
                "modelo": "Exec-L200",
                "serial": "S/N",
                "estado": EstadoBien.EN_USO,  # En uso
                "origen_ingreso": OrigenIngreso.FABRICACION,
                "motivo": "Fabricado en Taller de Carpintería Central UNEG para dotación de oficinas",
                "fecha_recepcion": date(2022, 11, 5),
                "codigo_contable": "1.2.3.02.01",
                "numero_ficha_responsable": "PROF-1092",
                "ubicacion_id": ubicacion_map["Departamento de Informática y Sistemas (Campus Puerto Ordaz)"].id,
                "responsable_id": user_map[RolUsuario.RPU].id,
            },
            {
                "correlativo": 1004,
                "familia": "EQUIPO CIENTIFICO Y DE LABORATORIO",
                "descripcion": "Osciloscopio Digital de 4 Canales 100MHz con generador de funciones",
                "marca": "Rigol",
                "modelo": "DS1054Z",
                "serial": "RIG-20210081",
                "estado": EstadoBien.EN_MANTENIMIENTO,  # En reparación / mantenimiento
                "origen_ingreso": OrigenIngreso.DONACION,
                "documento_aprobacion": "CU-RES-2021-088",
                "motivo": "Donación institucional de equipamiento por convenio científico",
                "fecha_recepcion": date(2021, 5, 14),
                "codigo_contable": "1.2.3.04.10",
                "numero_ficha_responsable": "PROF-1092",
                "ubicacion_id": ubicacion_map["Laboratorio de Redes y Telemática (Edif. General Piso 2)"].id,
                "responsable_id": user_map[RolUsuario.RPU].id,
            },
            {
                "correlativo": 1005,
                "familia": "EQUIPO DE PROC.DE DATOS",
                "descripcion": "Monitor CRT 17 pulgadas con tubo de rayos catódicos quemado",
                "marca": "Samsung",
                "modelo": "SyncMaster 793v",
                "serial": "SN-OLD-00129",
                "estado": EstadoBien.EN_DESUSO,  # Desincorporado
                "origen_ingreso": OrigenIngreso.COMPRA,
                "orden_compra": "OC-2010-0015",
                "codigo_contable": "1.2.3.01.05",
                "numero_ficha_responsable": "ADM-001",
                "ubicacion_id": ubicacion_map["Almacén Central de Bienes Nacionales (Campus Atlántico)"].id,
                "responsable_id": user_map[RolUsuario.ADMINISTRADOR].id,
            },
        ]

        bien_map = {}
        for bdata in bienes_data:
            bien = s.exec(select(Bien).where(Bien.correlativo == bdata["correlativo"])).first()
            if not bien:
                bien = Bien(**bdata)
                s.add(bien)
                s.commit()
                s.refresh(bien)
            bien_map[bdata["correlativo"]] = bien

        # 4. Trámites de Ejemplo
        existing_tramite = s.exec(select(Tramite)).first()
        if not existing_tramite and 1004 in bien_map and 1002 in bien_map:
            t1 = Tramite(
                tipo=TipoTramite.DESINCORPORACION,
                bien_id=bien_map[1004].id,
                solicitante_id=user_map[RolUsuario.DOCUMENTALISTA].id,
                estatus_tramite=EstatusTramite.PENDIENTE.value,
                motivo="Informe Técnico N° IT-2024-089: Avería insubsanable en tarjeta madre por sobretensión, repuesto descontinuado. Se solicita pase a EN DESUSO.",
                url_evidencia_multimedia=None,
            )
            t2 = Tramite(
                tipo=TipoTramite.REASIGNACION,
                bien_id=bien_map[1002].id,
                solicitante_id=user_map[RolUsuario.RPU].id,
                estatus_tramite=EstatusTramite.PENDIENTE.value,
                motivo="Solicitud de asignación del Servidor PowerEdge al Laboratorio de Telemática para prácticas docentes (Pase a EN USO).",
            )
            s.add(t1)
            s.add(t2)
            s.commit()

    if session:
        _seed(session)
    else:
        with Session(engine) as s:
            _seed(s)
