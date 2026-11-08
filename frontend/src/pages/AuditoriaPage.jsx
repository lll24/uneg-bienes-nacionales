import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ClipboardCheck, Printer, User, Search, Loader2 } from 'lucide-react';

export default function AuditoriaPage() {
  const [reporte, setReporte] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAuditoria = async (userId = '') => {
    setLoading(true);
    try {
      const res = await api.getAuditoria(userId || undefined);
      setReporte(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const usersRes = await api.getUsuarios();
        setUsuarios(usersRes);
        await loadAuditoria();
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadAuditoria(selectedUser);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Módulo de Auditoría y Fiscalización UNEG</h2>
          <p className="text-sm text-gray-500">
            Cruce físico de inventario agrupado por Responsable de Uso (Ficha del destinatario)
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-sm shadow flex items-center gap-2 transition-all"
        >
          <Printer size={18} />
          <span>Imprimir Acta de Verificación Física</span>
        </button>
      </div>

      {/* Filtro por Responsable */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
        <form onSubmit={handleFilter} className="flex-1 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <label className="text-xs font-semibold text-gray-600 uppercase">Filtrar por Responsable:</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white flex-1 max-w-md"
          >
            <option value="">Todos los Responsables Institucionales</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} - C.I. {u.cedula} {u.numero_ficha ? `(Ficha: ${u.numero_ficha})` : ''} ({u.rol})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
          >
            <Search size={16} /> Consultar
          </button>
        </form>
      </div>

      {/* Contenido del Reporte */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 flex flex-col items-center gap-2">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <span>Generando cruce de auditoría patrimonial...</span>
        </div>
      ) : !reporte || reporte.data.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <ClipboardCheck size={48} className="mx-auto text-gray-400 mb-2" />
          <p className="font-semibold text-lg text-gray-700">No hay registros para este responsable</p>
          <p className="text-sm">Actualmente no posee bienes asignados bajo su custodia directa.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reporte.data.map((item) => (
            <div key={item.responsable.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{item.responsable.nombre}</h3>
                    <p className="text-xs text-gray-500">
                      Cédula: <span className="font-mono font-semibold">{item.responsable.cedula}</span> | Ficha:{' '}
                      <span className="font-mono font-semibold text-blue-900">{item.responsable.numero_ficha || 'Sin ficha'}</span> | Rol:{' '}
                      <span className="font-semibold">{item.responsable.rol}</span>
                    </p>
                  </div>
                </div>
                <div className="bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  Total Bienes a Cargo: {item.total_bienes}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-100/70 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Correlativo</th>
                      <th className="px-3 py-2.5">Familia Oficial</th>
                      <th className="px-3 py-2.5">Descripción</th>
                      <th className="px-3 py-2.5">Serial / Marca / Modelo</th>
                      <th className="px-3 py-2.5">Estado del Bien</th>
                      <th className="px-3 py-2.5">Ubicación</th>
                      <th className="px-3 py-2.5 text-center">Constatación Física</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {item.bienes.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-mono font-bold text-blue-900">#{b.correlativo}</td>
                        <td className="px-3 py-2.5 font-medium">{b.familia}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-900">{b.descripcion}</td>
                        <td className="px-3 py-2.5 text-gray-500">
                          SN: {b.serial || 'S/N'} | {b.marca || '-'} {b.modelo || ''}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800">
                            {b.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">{b.ubicacion || 'Sin Ubicación'}</td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="inline-block w-4 h-4 border border-gray-400 rounded"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
