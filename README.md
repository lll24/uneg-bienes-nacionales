# 🏛️ Sistema de Gestión de Bienes Públicos UNEG (MVP)

Microservicio Web (API REST) y Aplicación Web Desacoplada para el control de inventario, fiscalización, movimientos y gestión patrimonial de la **Universidad Nacional Experimental de Guayana (UNEG)**.

Desarrollado bajo arquitectura limpia (_Separation of Concerns_), tipado estricto con **FastAPI + SQLModel**, base de datos **PostgreSQL**, migraciones estrictas con **Alembic**, frontend SPA reactivo en **React (Vite) + Tailwind CSS** y contenerización total mediante **Docker Compose**.

---

## 📑 Tabla de Contenidos

1. [Stack Tecnológico](#-stack-tecnológico)
2. [Estructura del Proyecto](#-estructura-del-proyecto-separation-of-concerns)
3. [Matriz de Roles y Reglas de Negocio (RBAC)](#-matriz-de-roles-y-reglas-de-negocio-rbac)
4. [Lógica de Dominio Patrimonial UNEG](#-lógica-de-dominio-patrimonial-uneg)
5. [Guía Maestra de Levantamiento con Docker (Paso a Paso)](#-guía-maestra-de-levantamiento-con-docker-paso-a-paso)
6. [Manejo de Migraciones con Alembic](#-manejo-estricto-de-migraciones-con-alembic)
7. [El Seeder Institucional (Carga de Datos de Prueba)](#-el-seeder-institucional-carga-de-datos-automática)
8. [Credenciales de Acceso Precargadas](#-credenciales-de-acceso-precargadas)
9. [Levantamiento en Entorno Local (Sin Docker)](#-levantamiento-en-entorno-local-sin-docker)
10. [Comandos de Mantenimiento y Solución de Problemas](#-comandos-de-mantenimiento-y-solución-de-problemas)
11. [Guía para Mandar el Proyecto a Git](#-guía-para-mandar-el-proyecto-a-git)

---

## 🛠️ Stack Tecnológico

- **Backend:** Python 3.12, FastAPI (Framework REST asíncrono de alto rendimiento).
- **ORM y Modelos de Datos:** SQLModel (Combina SQLAlchemy 2.0 y Pydantic v2).
- **Base de Datos:** PostgreSQL 16 (Imagen oficial `postgres:16-alpine`).
- **Control de Migraciones:** Alembic (Historial estricto de revisiones de esquema).
- **Seguridad:** Autenticación JWT (JSON Web Tokens) con cifrado `HS256` y contraseñas hasheadas con `bcrypt`.
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons (Arquitectura desacoplada).
- **Servidor Web / Proxy Reverso:** Nginx Alpine (Multi-stage build).
- **Contenerización y Orquestación:** Docker y Docker Compose.

---

## 📂 Estructura del Proyecto (Separation of Concerns)

```text
/uneg-bienes-proyecto
├── /backend
│   ├── /app
│   │   ├── /api
│   │   │   ├── deps.py               # Inyección de dependencias (DB session, Current User, RoleChecker RBAC)
│   │   │   └── /v1
│   │   │       ├── api.py            # Enrutador central v1
│   │   │       ├── auth.py           # Endpoints de autenticación (/login, /me)
│   │   │       ├── bienes.py         # CRUD de bienes, filtros, control perceptivo, auditoría y subida de factura
│   │   │       ├── tramites.py       # Flujos de trámites (Incorporación, Reasignación, Préstamo, Desincorporación)
│   │   │       ├── ubicaciones.py    # CRUD de áreas físicas y laboratorios
│   │   │       └── usuarios.py       # CRUD institucional de personal y asignación de roles
│   │   ├── /core
│   │   │   ├── config.py             # Configuración central con pydantic-settings (.env)
│   │   │   ├── database.py           # Motor SQLModel y generador de sesiones
│   │   │   ├── seeder.py             # Poblamiento automático inicial con datos reales UNEG
│   │   │   └── security.py           # Funciones de hashing bcrypt y generación de tokens JWT
│   │   ├── /models
│   │   │   ├── enums.py              # RolUsuario, EstadoBien, OrigenIngreso, TipoTramite, FAMILIAS_UNEG
│   │   │   └── entities.py           # Entidades SQLModel: Ubicacion, Usuario, Bien, Tramite
│   │   ├── /schemas                  # Modelos Pydantic v2 de entrada y salida (DTOs)
│   │   ├── /services
│   │   │   ├── correlativo.py        # Generador de número correlativo secuencial automático único
│   │   │   └── tramite_service.py    # Máquina de estados y motor de reglas RBAC
│   │   ├── /uploads                  # Directorio de evidencias, facturas y cartas PDF (volumen persistente)
│   │   └── main.py                   # Inicializador FastAPI, CORS, montaje de uploads y evento lifespan
│   ├── /alembic
│   │   ├── env.py                    # Configuración de contexto y descubrimiento de metadata SQLModel
│   │   ├── script.py.mako            # Plantilla de generación de revisiones
│   │   └── /versions
│   │       └── 0001_initial_schema.py # Migración inicial completa (tablas, índices, claves foráneas, enums)
│   ├── alembic.ini                   # Archivo de configuración central de Alembic
│   ├── Dockerfile                    # Imagen Docker de Python 3.12 con entrada automática de migraciones
│   └── requirements.txt              # Dependencias fijadas del backend
├── /frontend
│   ├── /src
│   │   ├── /api/client.js            # Cliente HTTP centralizado con token Bearer automático y subida multipart
│   │   ├── /context/AuthContext.jsx  # Proveedor de estado global de sesión y helpers de rol (isJefe, isAdmin...)
│   │   ├── /components
│   │   │   ├── Navbar.jsx            # Barra superior con datos del usuario y badge de rol por color
│   │   │   └── Sidebar.jsx           # Menú lateral reactivo según el rol autenticado
│   │   ├── /pages
│   │   │   ├── LoginPage.jsx         # Login por Cédula con botones de acceso rápido a los 6 roles
│   │   │   ├── DashboardPage.jsx     # Métricas institucionales (En Almacén, En Uso, Mantenimiento, Desuso)
│   │   │   ├── BienesPage.jsx        # Catálogo, filtros y modal de Control Perceptivo con formulario dinámico
│   │   │   ├── TramitesPage.jsx      # Bandeja de trámites con botones de aprobación RBAC y subida de PDF
│   │   │   ├── AuditoriaPage.jsx     # Módulo del Auditor: Cruce físico agrupado por RPU con vista de acta imprimible
│   │   │   ├── UbicacionesPage.jsx   # Gestión de sedes y dependencias físicas
│   │   │   └── UsuariosPage.jsx      # Administración de credenciales y roles
│   │   ├── App.jsx
│   │   ├── index.css                 # Directivas Tailwind CSS
│   │   └── main.jsx
│   ├── Dockerfile                    # Multi-stage build (Node 20 Alpine -> Nginx Alpine)
│   ├── nginx.conf                    # Servidor web, soporte para SPA (HTML5 History) y Reverse Proxy /api/
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml                # Orquestador multi-contenedor (db, backend, frontend)
├── .env                              # Variables de entorno predeterminadas
├── .gitignore                        # Reglas estrictas de exclusión de Git
└── README.md
```

---

## 👥 Matriz de Roles y Reglas de Negocio (RBAC)

El microservicio implementa **Control de Acceso Basado en Roles (RBAC)** estricto en cada endpoint:

| Rol                      | Atribución Principal         | Acción en el Sistema                                                                                                                                                                         |
| :----------------------- | :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **👑 Jefe**              | Máxima autoridad patrimonial | Aprueba o rechaza con clic final las **Reasignaciones** (cambio de custodio) y las **Desincorporaciones** (pase a _En desuso_).                                                              |
| **⚙️ Administrador**     | Gestión de plataforma        | Administra catálogos de sedes, crea usuarios, revisa stock general y aprueba **Préstamos** temporales.                                                                                       |
| **📝 Registrador**       | Control Perceptivo (Almacén) | Efectúa la revisión física en almacén. Registra el bien nuevo, define la modalidad de entrada (Compra, Donación, Fabricación) y el sistema **autogenera el número correlativo patrimonial**. |
| **📂 Documentalista**    | Expediente Técnico de Baja   | Especialista en desincorporación. Carga **informes técnicos de avería en PDF** o fotografías para armar el expediente antes de remitirlo a la firma del Jefe.                                |
| **🔍 Auditor**           | Cruce físico y fiscalización | Genera reportes agrupados por profesor/director responsable (**RPU**) y su **número de ficha** para realizar cruces físicos en las sedes con actas imprimibles.                              |
| **👤 Responsable (RPU)** | Custodia activa              | Profesores o directores que tienen bienes a su cargo (_En uso_). Consultan sus activos y solicitan trámites de traslado o reportan daños.                                                    |

---

## 🏛️ Lógica de Dominio Patrimonial UNEG

### 1. El Número Correlativo

- Es un **número entero secuencial continuo único** (`1, 2, 3... 28133`), sin prefijos ni textos redundantes, calculado automáticamente a partir del valor más alto registrado en el sistema (`func.max(Bien.correlativo) + 1`).

### 2. Modalidades de Ingreso y Requisitos Condicionales

El sistema adapta dinámicamente qué datos y documentos exige según el origen del activo:

- **Compra:** Exige obligatoriamente la **Orden de Compra** (`orden_compra`), el **Número de Factura** (`numero_factura`), la fecha de adquisición y permite adjuntar la factura digital en PDF.
- **Donación:** Exige obligatoriamente la **Carta o Acta de Aprobación por la Universidad** (`documento_aprobacion`) emitida por el Consejo Universitario y permite adjuntar el documento escaneado.
- **Fabricación propia:** No exige documentos comerciales externos. Registra que el bien fue elaborado en talleres de carpintería, metalmecánica o laboratorios de la UNEG.
- **Otros:** Permite adjuntar resoluciones de comodato o transferencias y exige una justificación u observación obligatoria.

### 3. El Estado Unificado del Bien (Ciclo de Vida)

El campo `estado` consolida tanto la disponibilidad física como administrativa:

- **En Almacén:** `Nuevo`, `Buen estado`, `Regular`, `Deteriorado`, `Inservible`.
- **En Custodia Activa:** `En uso` (asignado a un profesor o dependencia).
- **En Reparación:** `En mantenimiento` (enviado a taller técnico).
- **Desincorporado:** `En desuso` (dado de baja definitivamente por resolución del Jefe).

### 4. Las 19 Familias Oficiales UNEG

Extraídas del formato patrimonial oficial de la universidad:
`EDIFICIOS E INSTALACIONES`, `EQUIPO CIENTIFICO Y DE LABORATORIO`, `EQUIPO DE DEPORTE, MUSICA Y RECREACION`, `EQUIPO DE ENERGIA`, `EQUIPO DE OFICINA Y OTROS`, `EQUIPO DE PROC.DE DATOS`, `EQUIPO DE SEGURIDAD`, `EQUIPOS DE ACONDICIONAMIENTO DE AIRE`, `EQUIPOS DE AUDIO Y VIDEO`, `EQUIPOS DE COMUNICACION`, `EQUIPOS MEDICOS QUIRURGICOS, VETERINARIO`, `INSTRUMENTOS MUSICALES`, `MAQ.DE ARTES GRAFICAS`, `MAQUINA PARA INDUSTRIA DE LA MADERA`, `MAQUINA Y EQUIPO DE TALLER AUTOMOTOR`, `MAQUINARIAS Y EQUIPOS AGRICOLAS Y PECUAR`, `MOBILIARIO`, `OBRAS DE ARTES`, `VEHICULOS`.

---

## 🚀 Guía Maestra de Levantamiento con Docker (Paso a Paso)

Todo el ecosistema está configurado para arrancar con un único comando orquestado.

### Prerrequisitos

- Tener instalado **Docker Desktop** en Windows (y que esté abierto y funcionando).
- No tener ocupados en Windows los puertos `5432` (Postgres), `8000` (FastAPI) ni `3000` (Frontend).

---

### Paso 1: Clonar o abrir la terminal en la raíz del proyecto

```bash
git clone https://github.com/III24/uneg-bienes-nacionales.git
cd uneg-bienes-nacionales
```

---

### Paso 2: Ejecutar el levantamiento

Ejecuta el siguiente comando maestro:

```bash
docker compose up --build
```

_(Si deseas levantar en segundo plano y liberar tu terminal, agrega la bandera `-d`: `docker compose up -d --build`)._

---

### 🔍 ¿Qué ocurre internamente paso a paso durante el levantamiento?

```text
       docker compose up --build
                  │
                  ▼
   1. [uneg_bienes_db] (PostgreSQL 16)
      ├── Descarga imagen postgres:16-alpine
      ├── Monta el volumen persistente 'pgdata' en /var/lib/postgresql/data
      ├── Expone el puerto 5432
      └── Ejecuta healthcheck cada 5s: "pg_isready -U uneg_user -d uneg_bienes_db"
                  │
                  ▼ (Espera a que el contenedor 'db' reporte: HEALTHY)
   2. [uneg_bienes_backend] (FastAPI en Python 3.12)
      ├── Construye Dockerfile (instala gcc, libpq-dev, requirements.txt)
      ├── Monta código en vivo (- ./backend/app:/app/app)
      ├── Monta carpeta de uploads (- ./backend/uploads:/app/uploads)
      ├── Ejecuta: alembic upgrade head
      │     └── Conecta a Postgres y aplica la migración 0001_initial_schema.py:
      │           - Crea Enums: rolusuario, estadobien, origeningreso, tipotramite
      │           - Crea Tablas: ubicacion, usuario, bien, tramite con sus índices
      ├── Ejecuta lifespan de FastAPI -> seed_database()
      │     └── Si la base está vacía:
      │           - Registra los 6 usuarios institucionales (Admin, Jefe, Registrador...)
      │           - Registra las 4 ubicaciones oficiales UNEG
      │           - Registra los 5 bienes de prueba (#1001 a #1005)
      │           - Registra los trámites de prueba (Desincorporación y Reasignación)
      └── Inicia Uvicorn ASGI Server en 0.0.0.0:8000 con Hot-Reloading activo
                  │
                  ▼
   3. [uneg_bienes_frontend] (React 18 + Vite + Nginx)
      ├── Etapa 1 (Build): Node 20 ejecuta "npm install" y "npm run build"
      ├── Etapa 2 (Deploy): Transfiere el bundle compilado a /usr/share/nginx/html
      ├── Configura Nginx:
      │     ├── Escucha en puerto 80 (mapeado al 3000 de Windows)
      │     ├── SPA Fallback: redirige rutas cliente a index.html (evita 404)
      │     └── Reverse Proxy: redirige /api/ y /uploads/ hacia http://backend:8000/
      └── Listo para recibir tráfico web
```

---

### Paso 3: Acceso a las Aplicaciones

| Componente                            | Dirección URL                                                | Función                                                |
| :------------------------------------ | :----------------------------------------------------------- | :----------------------------------------------------- |
| 🌐 **Frontend Web (React SPA)**       | [http://localhost:3000](http://localhost:3000)               | Aplicación visual interactiva completa.                |
| 📖 **API Docs Interactiva (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs)     | Pruebas de endpoints REST y contratos JSON.            |
| 📚 **API Docs (ReDoc)**               | [http://localhost:8000/redoc](http://localhost:8000/redoc)   | Documentación técnica legible de la API.               |
| 🩺 **Chequeo de Salud (Health)**      | [http://localhost:8000/health](http://localhost:8000/health) | Endpoint de monitoreo de estado.                       |
| 🗄️ **Base de Datos PostgreSQL**       | `localhost:5432`                                             | Base de datos `uneg_bienes_db` (Usuario: `uneg_user`). |

---

## 📦 Manejo Estricto de Migraciones con Alembic

En este proyecto, **las tablas de la base de datos nunca se crean a mano**. Todo el esquema se gestiona con Alembic a partir de los modelos de [`backend/app/models/entities.py`](backend/app/models/entities.py).

### 1. ¿Cómo se ejecutan automáticamente en Docker?

Al iniciar el contenedor del backend, el comando `alembic upgrade head` se ejecuta antes de levantar Uvicorn. Si hay migraciones nuevas pendientes, se aplican automáticamente antes de que la aplicación empiece a recibir peticiones.

### 2. Comandos para generar y aplicar migraciones dentro de Docker

Si en el futuro agregas o modificas un campo en [`backend/app/models/entities.py`](backend/app/models/entities.py), ejecuta en tu terminal con los contenedores arriba:

```bash
# 1. Autogenerar una nueva migración detectando los cambios en los modelos SQLModel
docker compose exec backend alembic revision --autogenerate -m "nombre_del_cambio"

# 2. Aplicar la nueva migración en PostgreSQL
docker compose exec backend alembic upgrade head

# 3. Ver el historial de migraciones aplicadas
docker compose exec backend alembic current

# 4. Revertir la última migración (si necesitas hacer rollback)
docker compose exec backend alembic downgrade -1
```

---

## 🌱 El Seeder Institucional (Carga de Datos Automática)

El seeder ubicado en [`backend/app/core/seeder.py`](backend/app/core/seeder.py) se ejecuta de forma inteligente: **si la base de datos ya tiene datos, no sobreescribe nada; si está recién creada, la puebla de inmediato**.

### ¿Qué datos inserta exactamente?

1. **Usuarios Institucionales (Los 6 roles RBAC con contraseña `bcrypt` y número de ficha):**
   - **Administrador:** C.I. `V-00000001` (Ficha `ADM-001`)
   - **Jefe de Bienes:** C.I. `V-00000002` (Ficha `JEF-002`)
   - **Registrador:** C.I. `V-00000003` (Ficha `REG-003`)
   - **Documentalista:** C.I. `V-00000004` (Ficha `DOC-004`)
   - **Auditor:** C.I. `V-00000005` (Ficha `AUD-005`)
   - **Responsable (RPU):** C.I. `V-00000006` (Ficha `PROF-1092`)

2. **Ubicaciones Físicas de la UNEG:**
   - Almacén Central de Bienes Nacionales (Campus Atlántico)
   - Laboratorio de Redes y Telemática (Edif. General Piso 2)
   - Departamento de Informática y Sistemas (Campus Puerto Ordaz)
   - Decanato de Investigación y Postgrado (Edif. Administrativo)

3. **Bienes Patrimoniales de Demostración:**
   - **`#1001`:** Estación de Trabajo Dell OptiPlex 7090 (Familia _EQUIPO DE PROC.DE DATOS_ / Modalidad _Compra_ con O/C y Factura / Estado _En uso_).
   - **`#1002`:** Servidor en Rack PowerEdge R740 (Modalidad _Compra_ / Estado _Nuevo_ en Almacén).
   - **`#1003`:** Escritorio Modular Ejecutivo (Familia _MOBILIARIO_ / Modalidad _Fabricación_ en talleres UNEG / Estado _En uso_).
   - **`#1004`:** Osciloscopio Digital Rigol (Modalidad _Donación_ con Acta de Aprobación CU / Estado _En mantenimiento_).
   - **`#1005`:** Monitor CRT Antiguo averiado (Modalidad _Compra_ / Estado _En desuso_ - Desincorporado).

4. **Trámites de Prueba en Bandeja:**
   - Un trámite de **Desincorporación Técnica** iniciado por el Documentalista sobre el bien `#1004` con justificación de avería, listo para que el Jefe lo apruebe.
   - Un trámite de **Reasignación** iniciado por el RPU sobre el servidor `#1002`, listo para su resolución.

### ¿Cómo re-ejecutar el seeder manualmente en Docker?

Si en algún momento limpias la base de datos o deseas re-sembrar datos:

```bash
docker compose exec backend python -c "from app.core.seeder import seed_database; seed_database()"
```

---

## 🔑 Credenciales de Acceso Precargadas

En la pantalla de Login ([http://localhost:3000](http://localhost:3000)) tienes **botones de un solo clic** para probar cada uno de los roles sin tener que escribir las credenciales a mano:

| Rol                   | Cédula       | Contraseña   | Atribución Clave en el MVP                                                    |
| :-------------------- | :----------- | :----------- | :---------------------------------------------------------------------------- |
| **⚙️ Administrador**  | `V-00000001` | `Admin1234!` | Acceso a sedes, usuarios, catálogo total y aprobación de préstamos.           |
| **👑 Jefe**           | `V-00000002` | `Jefe1234!`  | Botones de aprobación/rechazo final para Reasignaciones y Desincorporaciones. |
| **📝 Registrador**    | `V-00000003` | `Reg1234!`   | Botón de _Control Perceptivo (Registrar Entrada)_ con correlativo automático. |
| **📂 Documentalista** | `V-00000004` | `Doc1234!`   | Inicia expedientes de Desincorporación y adjunta informes técnicos en PDF.    |
| **🔍 Auditor**        | `V-00000005` | `Aud1234!`   | Consulta el módulo de auditoría agrupado por RPU y genera actas de cruce.     |
| **👤 Custodio (RPU)** | `V-00000006` | `Rpu1234!`   | Ve sus bienes a cargo y solicita reasignaciones de ubicación/custodio.        |

---

## 💻 Levantamiento en Entorno Local (Sin Docker)

Si prefieres ejecutar el código directamente en tu máquina Windows sin Docker:

### 1. Levantar el Backend

```powershell
cd backend

# Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables en .env (o apuntar a tu PostgreSQL local)
# Ejecutar migraciones con Alembic
alembic upgrade head

# Iniciar servidor FastAPI
uvicorn app.main:app --reload --port 8000
```

### 2. Levantar el Frontend

```powershell
cd frontend

# Instalar paquetes
npm install

# Iniciar servidor de desarrollo de Vite
npm run dev
```

Acceder al frontend local en: [http://localhost:5173](http://localhost:5173).

---

## 🔧 Comandos de Mantenimiento y Solución de Problemas

### 1. Monitorear los logs en tiempo real

Para ver lo que está pasando en la consola del backend (consultas SQL, errores, peticiones HTTP):

```bash
docker compose logs -f backend
```

### 2. Apagar los contenedores

Para detener el sistema al finalizar el trabajo:

```bash
docker compose down
```

_(Tus datos en PostgreSQL permanecen intactos guardados en el volumen `pgdata`)._

### 3. Reiniciar desde cero absoluto (Reset Total de Datos)

Si deseas borrar por completo la base de datos, las imágenes construidas y reiniciar el seeder desde cero:

```bash
docker compose down -v
docker compose up --build
```

_(La bandera `-v` elimina los volúmenes, forzando a Postgres y Alembic a recrear todo limpio)._

### 4. Solución de conflicto de puertos en Windows

- **Error `bind: address already in use` en puerto 5432:** Tienes un PostgreSQL local corriendo en Windows como servicio. Puedes detenerlo temporalmente abriendo PowerShell como Administrador:
  ```powershell
  Stop-Service postgresql*
  ```
- **Error en puerto 8000 o 3000:** Tienes otra aplicación web corriendo en ese puerto. Ciérrala o cambia el puerto externo en `docker-compose.yml` (ej. `"8001:8000"` o `"3001:80"`).

---
