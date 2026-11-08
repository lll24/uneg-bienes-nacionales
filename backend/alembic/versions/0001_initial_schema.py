"""initial_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2024-11-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Tabla Ubicacion
    op.create_table(
        'ubicacion',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ubicacion_nombre'), 'ubicacion', ['nombre'], unique=False)

    # 2. Tabla Usuario
    op.create_table(
        'usuario',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('cedula', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('rol', sa.Enum('JEFE', 'ADMINISTRADOR', 'REGISTRADOR', 'DOCUMENTALISTA', 'AUDITOR', 'RPU', name='rolusuario'), nullable=False),
        sa.Column('hashed_password', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('numero_ficha', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_usuario_cedula'), 'usuario', ['cedula'], unique=True)
    op.create_index(op.f('ix_usuario_numero_ficha'), 'usuario', ['numero_ficha'], unique=False)

    # 3. Tabla Bien con Estado Único Unificado
    op.create_table(
        'bien',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('correlativo', sa.Integer(), nullable=False),
        sa.Column('familia', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('descripcion', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('marca', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('modelo', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('serial', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('codigo_serie', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('estado', sa.Enum('NUEVO', 'BUEN_ESTADO', 'REGULAR', 'DETERIORADO', 'INSERVIBLE', 'EN_USO', 'EN_MANTENIMIENTO', 'EN_DESUSO', name='estadobien'), nullable=False),
        sa.Column('origen_ingreso', sa.Enum('COMPRA', 'DONACION', 'FABRICACION', 'OTROS', name='origeningreso'), nullable=False, server_default='COMPRA'),
        sa.Column('orden_compra', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('numero_factura', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('fecha_adquisicion', sa.Date(), nullable=True),
        sa.Column('documento_aprobacion', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('url_documento_origen', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('fecha_recepcion', sa.Date(), nullable=True),
        sa.Column('fecha_registro', sa.DateTime(timezone=True), nullable=False),
        sa.Column('motivo', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('observaciones', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('codigo_contable', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('fecha_depreciacion', sa.Date(), nullable=True),
        sa.Column('numero_ficha_responsable', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('ubicacion_id', sa.Integer(), nullable=False),
        sa.Column('responsable_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['responsable_id'], ['usuario.id'], ),
        sa.ForeignKeyConstraint(['ubicacion_id'], ['ubicacion.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bien_correlativo'), 'bien', ['correlativo'], unique=True)
    op.create_index(op.f('ix_bien_familia'), 'bien', ['familia'], unique=False)

    # 4. Tabla Tramite
    op.create_table(
        'tramite',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tipo', sa.Enum('INCORPORACION', 'REASIGNACION', 'PRESTAMO', 'DESINCORPORACION', name='tipotramite'), nullable=False),
        sa.Column('bien_id', sa.Integer(), nullable=False),
        sa.Column('solicitante_id', sa.Integer(), nullable=False),
        sa.Column('fecha_solicitud', sa.DateTime(timezone=True), nullable=False),
        sa.Column('estatus_tramite', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('url_evidencia_multimedia', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('aprobado_por_id', sa.Integer(), nullable=True),
        sa.Column('motivo', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('fecha_resolucion', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['aprobado_por_id'], ['usuario.id'], ),
        sa.ForeignKeyConstraint(['bien_id'], ['bien.id'], ),
        sa.ForeignKeyConstraint(['solicitante_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('tramite')
    op.drop_index(op.f('ix_bien_familia'), table_name='bien')
    op.drop_index(op.f('ix_bien_correlativo'), table_name='bien')
    op.drop_table('bien')
    op.drop_index(op.f('ix_usuario_numero_ficha'), table_name='usuario')
    op.drop_index(op.f('ix_usuario_cedula'), table_name='usuario')
    op.drop_table('usuario')
    op.drop_index(op.f('ix_ubicacion_nombre'), table_name='ubicacion')
    op.drop_table('ubicacion')
    op.execute('DROP TYPE IF EXISTS tipotramite')
    op.execute('DROP TYPE IF EXISTS origeningreso')
    op.execute('DROP TYPE IF EXISTS estadobien')
    op.execute('DROP TYPE IF EXISTS rolusuario')
