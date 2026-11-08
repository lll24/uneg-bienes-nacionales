import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { FileText, Plus, CheckCircle, XCircle, Upload, Eye, Clock, AlertCircle, Loader2 } from 'lucide-react';

export default function TramitesPage() {
  const { user, isJefe, isAdmin, isDocumentalista, isRPU, isRegistrador } = useAuth();
  const [tramites, setTramites] = useState([]);
  const [bienes, setBienes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('');

  // Modal Nuevo Trámite
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoTramite, setTipoTramite] = useState(
    isDocumentalista ? 'Desincorporación' : 'Reasignación'
  );
  const [selectedBienId, setSelectedBienId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Decisión (Aprobar / Rechazar)
  const [decisionModal, setDecisionModal] = useState({ open: false, tramite: null, accion: '' });
  const [observaciones, setObservaciones] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tramitesRes, bienesRes] = await Promise.all([
        api.getTramites({
          tipo: filterTipo || undefined,
          estatus: filterEstatus || undefined,
        }),
        api.getBienes(),
      ]);
      setTramites(tramitesRes);
      setBienes(bienesRes);
      if (bienesRes.length > 0 && !selectedBienId) {
        setSelectedBienId(bienesRes[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterTipo, filterEstatus]);

  const handleCreateTramite = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      let urlEvidencia = null;
      if (fileToUpload) {
        const uploadRes = await api.uploadEvidencia(fileToUpload);
        urlEvidencia = uploadRes.url_evidencia_multimedia;
      }

      await api.createTramite({
        tipo: tipoTramite,
        bien_id: parseInt(selectedBienId, 10),
        motivo,
        url_evidencia_multimedia: urlEvidencia,
      });

      setIsModalOpen(false);
      setMotivo('');
      setFileToUpload(null);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar el trámite');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecisionSubmit = async () => {
    if (!decisionModal.tramite) return;
    setSubmitting(true);
    try {
      await api.decidirTramite(
        decisionModal.tramite.id,
        decisionModal.accion,
        observaciones
      );
      setDecisionModal({ open: false, tramite: null, accion: '' });
      setObservaciones('');
      loadData();
    } catch (err) {
      alert(err.message || 'Error al procesar la decisión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Trámites y Flujos Patrimoniales</h2>
          <p className="text-sm text-gray-500">
            Aprobaciones, desincorporaciones con informe técnico y reasignaciones
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold text-sm shadow flex items-center gap-2 transition-all"
        >
          <Plus size={18} />
          <span>Iniciar Trámite / Expediente</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-3">
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todos los Tipos de Trámite</option>
          <option value="Incorporación">Incorporación</option>
          <option value="Reasignación">Reasignación</option>
          <option value="Préstamo">Préstamo</option>
          <option value="Desincorporación">Desincorporación</option>
        </select>

        <select
          value={filterEstatus}
          onChange={(e) => setFilterEstatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todos los Estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Aprobado">Aprobado</option>
          <option value="Rechazado">Rechazado</option>
        </select>
      </div>

      {/* Tabla de Trámites */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span>Cargando trámites...</span>
          </div>
        ) : tramites.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="font-semibold text-lg text-gray-700">No hay trámites registrados</p>
            <p className="text-sm">Inicie una solicitud de reasignación o desincorporación técnica.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">ID / Tipo</th>
                  <th className="px-4 py-3">Bien Implicado</th>
                  <th className="px-4 py-3">Solicitante</th>
                  <th className="px-4 py-3">Motivo / Evidencia</th>
                  <th className="px-4 py-3">Estatus</th>
                  <th className="px-4 py-3 text-right">Acciones RBAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tramites.map((t) => {
                  const isPending = t.estatus_tramite === 'Pendiente';
                  const canJefeDecide = isJefe && isPending && ['Reasignación', 'Desincorporación'].includes(t.tipo);
                  const canAdminDecide = isAdmin && isPending;

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">#{t.id}</span>
                        <div className="font-bold text-gray-900">{t.tipo}</div>
                        <div className="text-[11px] text-gray-400">
                          {new Date(t.fecha_solicitud).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-blue-900 text-xs">
                          {t.bien?.correlativo ? `#${t.bien.correlativo}` : `Bien ID: ${t.bien_id}`}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-1">{t.bien?.descripcion}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-gray-800">{t.solicitante?.nombre || 'N/A'}</div>
                        <div className="text-gray-500">{t.solicitante?.rol}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="text-gray-700 max-w-xs">{t.motivo || 'Sin detalles adicionales'}</div>
                        {t.url_evidencia_multimedia && (
                          <a
                            href={t.url_evidencia_multimedia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold mt-1"
                          >
                            <Eye size={12} /> Ver Evidencia / Informe PDF
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            t.estatus_tramite === 'Pendiente'
                              ? 'bg-amber-100 text-amber-800'
                              : t.estatus_tramite === 'Aprobado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {t.estatus_tramite}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isPending && (canJefeDecide || canAdminDecide) ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setDecisionModal({ open: true, tramite: t, accion: 'Aprobado' })}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-1"
                              title="Aprobar Trámite"
                            >
                              <CheckCircle size={14} /> Aprobar
                            </button>
                            <button
                              onClick={() => setDecisionModal({ open: true, tramite: t, accion: 'Rechazado' })}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-md shadow-sm flex items-center gap-1"
                              title="Rechazar Trámite"
                            >
                              <XCircle size={14} /> Rechazar
                            </button>
                          </div>
                        ) : isPending ? (
                          <span className="text-xs text-gray-400 italic">
                            {t.tipo === 'Desincorporación' || t.tipo === 'Reasignación'
                              ? 'En espera del Jefe'
                              : 'En espera de Admin'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Resuelto por {t.aprobado_por?.nombre || 'Autoridad'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Iniciar Trámite */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg">Nuevo Trámite Patrimonial</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 font-bold text-xl">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTramite} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Trámite</label>
                <select
                  value={tipoTramite}
                  onChange={(e) => setTipoTramite(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm"
                >
                  <option value="Reasignación">Reasignación (Cambio de responsable/área)</option>
                  <option value="Desincorporación">
                    Desincorporación (Dañado/Obsolescencia - Requiere Informe Técnico)
                  </option>
                  <option value="Préstamo">Préstamo Temporal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bien Patrimonial</label>
                <select
                  value={selectedBienId}
                  onChange={(e) => setSelectedBienId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 bg-white text-sm"
                >
                  {bienes.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.correlativo}] {b.descripcion} - ({b.estatus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Justificación / Motivo Técnico
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={
                    tipoTramite === 'Desincorporación'
                      ? 'Describa el estado de avería insubsanable o daño según evaluación técnica...'
                      : 'Indique el motivo del movimiento o solicitud...'
                  }
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Evidencia Multimedia / Informe Técnico (PDF o Foto)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  {tipoTramite === 'Desincorporación'
                    ? 'Especialmente recomendado para Documentalistas al armar el expediente de baja.'
                    : 'Opcional para respaldar la solicitud.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Enviar Trámite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Decisión (Jefe / Admin) */}
      {decisionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-2">
              Confirmar Decisión: {decisionModal.accion}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Trámite #{decisionModal.tramite?.id} - {decisionModal.tramite?.tipo} para el bien{' '}
              <strong>{decisionModal.tramite?.bien?.correlativo}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Observaciones o Instrucciones Finales
              </label>
              <textarea
                rows={2}
                placeholder="Observaciones de la resolución institucional..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDecisionModal({ open: false, tramite: null, accion: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDecisionSubmit}
                disabled={submitting}
                className={`px-4 py-2 text-white font-semibold rounded-lg text-sm flex items-center gap-2 ${
                  decisionModal.accion === 'Aprobado'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Confirmar {decisionModal.accion}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

