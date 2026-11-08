import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Boxes, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DashboardPage({ setCurrentTab }) {
  const { user, isJefe, isAdmin, isRegistrador, isDocumentalista, isAuditor } = useAuth();
  const [bienes, setBienes] = useState([]);
  const [tramites, setTramites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bienesData, tramitesData] = await Promise.all([
          api.getBienes(),
          api.getTramites(),
        ]);
        setBienes(bienesData);
        setTramites(tramitesData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalBienes = bienes.length;
  const enAlmacen = bienes.filter((b) =>
    ['Nuevo', 'Buen estado', 'Regular', 'Deteriorado', 'Inservible'].includes(b.estado)
  ).length;
  const enUso = bienes.filter((b) => b.estado === 'En uso').length;
  const enMantenimiento = bienes.filter((b) => b.estado === 'En mantenimiento').length;
  const enDesuso = bienes.filter((b) => b.estado === 'En desuso').length;
  const tramitesPendientes = tramites.filter((t) => t.estatus_tramite === 'Pendiente').length;

  return (
    <div className="space-y-6">
      {/* Bienvenida y Rol */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">¡Bienvenido(a), {user.nombre}!</h2>
          <p className="text-blue-200 text-sm mt-1">
            Módulo activo con perfil de <span className="font-semibold text-yellow-300">{user.rol}</span>.
          </p>
        </div>
        <div className="flex gap-2">
          {isRegistrador && (
            <button
              onClick={() => setCurrentTab('bienes')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold shadow transition-all flex items-center gap-2"
            >
              Control Perceptivo (Nuevo Bien) <ArrowRight size={16} />
            </button>
          )}
          {isJefe && (
            <button
              onClick={() => setCurrentTab('tramites')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-semibold shadow transition-all flex items-center gap-2"
            >
              Revisar Trámites Pendientes <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Boxes size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Total Bienes</p>
            <p className="text-xl font-bold text-gray-900">{totalBienes}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">En Almacén</p>
            <p className="text-xl font-bold text-emerald-600">{enAlmacen}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Boxes size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">En Uso</p>
            <p className="text-xl font-bold text-indigo-600">{enUso}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">En Mantenimiento</p>
            <p className="text-xl font-bold text-yellow-600">{enMantenimiento}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Desincorporados</p>
            <p className="text-xl font-bold text-rose-600">{enDesuso}</p>
          </div>
        </div>
      </div>

      {/* Resumen de Flujo RBAC según el Rol */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Guía Rápida de Atribuciones por Rol (RBAC)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40">
            <span className="font-bold text-purple-900 block mb-1">👑 Jefe</span>
            <p className="text-gray-600 text-xs">
              Máxima autoridad. Otorga la aprobación final a <strong>Reasignaciones</strong> y <strong>Desincorporaciones</strong>.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
            <span className="font-bold text-blue-900 block mb-1">⚙️ Administrador</span>
            <p className="text-gray-600 text-xs">
              Gestiona la plataforma, catálogos, ubicaciones y aprueba préstamos temporales.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <span className="font-bold text-emerald-900 block mb-1">📝 Registrador</span>
            <p className="text-gray-600 text-xs">
              Efectúa el <strong>Control Perceptivo</strong>. Registra las especificaciones técnicas iniciales y genera el correlativo patrimonial.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
            <span className="font-bold text-amber-900 block mb-1">📂 Documentalista</span>
            <p className="text-gray-600 text-xs">
              Especialista en <strong>Desincorporación</strong>. Sube informes técnicos y evidencias de avería para sustentar el expediente.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
            <span className="font-bold text-rose-900 block mb-1">🔍 Auditor</span>
            <p className="text-gray-600 text-xs">
              Genera reportes de inventario por responsable para realizar cruces físicos periódicos.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/40">
            <span className="font-bold text-cyan-900 block mb-1">👤 Responsable (RPU)</span>
            <p className="text-gray-600 text-xs">
              Profesores y directores con bienes a cargo. Solicitan movimientos o notifican novedades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

