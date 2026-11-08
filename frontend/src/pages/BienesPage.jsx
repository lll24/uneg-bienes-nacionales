import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Plus,
  Search,
  ShieldCheck,
  Tag,
  MapPin,
  User,
  FileSpreadsheet,
  Loader2,
  Hash,
  Paperclip,
  Eye,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

const FAMILIAS_UNEG = [
  'EDIFICIOS E INSTALACIONES',
  'EQUIPO CIENTIFICO Y DE LABORATORIO',
  'EQUIPO DE DEPORTE, MUSICA Y RECREACION',
  'EQUIPO DE ENERGIA',
  'EQUIPO DE OFICINA Y OTROS',
  'EQUIPO DE PROC.DE DATOS',
  'EQUIPO DE SEGURIDAD',
  'EQUIPOS DE ACONDICIONAMIENTO DE AIRE',
  'EQUIPOS DE AUDIO Y VIDEO',
  'EQUIPOS DE COMUNICACION',
  'EQUIPOS MEDICOS QUIRURGICOS, VETERINARIO',
  'INSTRUMENTOS MUSICALES',
  'MAQ.DE ARTES GRAFICAS',
  'MAQUINA PARA INDUSTRIA DE LA MADERA',
  'MAQUINA Y EQUIPO DE TALLER AUTOMOTOR',
  'MAQUINARIAS Y EQUIPOS AGRICOLAS Y PECUAR',
  'MOBILIARIO',
  'OBRAS DE ARTES',
  'VEHICULOS',
];

const ESTADOS_BIEN = [
  { value: 'Nuevo', label: 'Nuevo (Almacén)', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'Buen estado', label: 'Buen estado (Almacén)', color: 'bg-green-100 text-green-800' },
  { value: 'Regular', label: 'Regular (Almacén)', color: 'bg-blue-100 text-blue-800' },
  { value: 'Deteriorado', label: 'Deteriorado (Almacén)', color: 'bg-amber-100 text-amber-800' },
  { value: 'Inservible', label: 'Inservible (Almacén)', color: 'bg-rose-100 text-rose-800' },
  { value: 'En uso', label: 'En uso (Custodio activo)', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'En mantenimiento', label: 'En mantenimiento (Reparación)', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'En desuso', label: 'En desuso (Desincorporado)', color: 'bg-red-100 text-red-800' },
];

const ORIGENES_INGRESO = [
  { value: 'Compra', label: 'Compra (Factura / Orden de Compra)' },
  { value: 'Donación', label: 'Donación (Carta de Aprobación UNEG)' },
  { value: 'Fabricación', label: 'Fabricación (Talleres UNEG)' },
  { value: 'Otros', label: 'Otros (Entrada con Justificativo)' },
];

export default function BienesPage() {
  const { isRegistrador, isAdmin, isJefe } = useAuth();
  const [bienes, setBienes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterOrigen, setFilterOrigen] = useState('');
  const [filterFamilia, setFilterFamilia] = useState('');

  // Modal de Incorporación / Control Perceptivo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);

  // Formulario nuevo bien
  const [formData, setFormData] = useState({
    familia: FAMILIAS_UNEG[5], // Default: EQUIPO DE PROC.DE DATOS
    descripcion: '',
    marca: '',
    modelo: '',
    serial: '',
    codigo_serie: '',
    estado: 'Nuevo',
    origen_ingreso: 'Compra',
    orden_compra: '',
    numero_factura: '',
    fecha_adquisicion: '',
    documento_aprobacion: '',
    url_documento_origen: '',
    fecha_recepcion: '',
    motivo: '',
    observaciones: '',
    codigo_contable: '',
    fecha_depreciacion: '',
    numero_ficha_responsable: '',
    ubicacion_id: '',
    responsable_id: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bienesRes, ubicacionesRes, usuariosRes] = await Promise.all([
        api.getBienes({
          search: search || undefined,
          estado: filterEstado || undefined,
          origen_ingreso: filterOrigen || undefined,
          familia: filterFamilia || undefined,
        }),
        api.getUbicaciones(),
        api.getUsuarios(),
      ]);
      setBienes(bienesRes);
      setUbicaciones(ubicacionesRes);
      setUsuarios(usuariosRes);
      if (ubicacionesRes.length > 0 && !formData.ubicacion_id) {
        setFormData((prev) => ({
          ...prev,
          ubicacion_id: ubicacionesRes[0].id,
          responsable_id: usuariosRes.length > 0 ? usuariosRes[0].id : '',
          numero_ficha_responsable: usuariosRes.length > 0 ? (usuariosRes[0].numero_ficha || '') : '',
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterEstado, filterOrigen, filterFamilia]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleResponsableChange = (userId) => {
    const user = usuarios.find((u) => u.id === parseInt(userId, 10));
    setFormData((prev) => ({
      ...prev,
      responsable_id: userId,
      numero_ficha_responsable: user?.numero_ficha || prev.numero_ficha_responsable,
    }));
  };

  const handleCreateBien = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      let urlDoc = formData.url_documento_origen;
      if (fileToUpload) {
        const uploadRes = await api.uploadDocumentoSoporte(fileToUpload);
        urlDoc = uploadRes.url_documento_origen;
      }

      const payload = {
        ...formData,
        url_documento_origen: urlDoc || null,
        ubicacion_id: parseInt(formData.ubicacion_id, 10),
        responsable_id: parseInt(formData.responsable_id, 10),
        fecha_recepcion: formData.fecha_recepcion || null,
        fecha_adquisicion: formData.fecha_adquisicion || null,
        fecha_depreciacion: formData.fecha_depreciacion || null,
      };

      await api.createBien(payload);
      setIsModalOpen(false);
      setFileToUpload(null);
      setFormData({
        familia: FAMILIAS_UNEG[5],
        descripcion: '',
        marca: '',
        modelo: '',
        serial: '',
        codigo_serie: '',
        estado: 'Nuevo',
        origen_ingreso: 'Compra',
        orden_compra: '',
        numero_factura: '',
        fecha_adquisicion: '',
        documento_aprobacion: '',
        url_documento_origen: '',
        fecha_recepcion: '',
        motivo: '',
        observaciones: '',
        codigo_contable: '',
        fecha_depreciacion: '',
        numero_ficha_responsable: '',
        ubicacion_id: ubicaciones.length > 0 ? ubicaciones[0].id : '',
        responsable_id: usuarios.length > 0 ? usuarios[0].id : '',
      });
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar el bien en el inventario');
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoBadgeClass = (estado) => {
    const found = ESTADOS_BIEN.find((e) => e.value === estado);
    return found ? found.color : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Catálogo de Bienes e Inventario UNEG</h2>
          <p className="text-sm text-gray-500">
            Control Perceptivo, modalidad de entrada (Compra, Donación, Fabricación) y seguimiento patrimonial
          </p>
        </div>

        {(isRegistrador || isAdmin || isJefe) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm shadow flex items-center gap-2 transition-all"
          >
            <Plus size={18} />
            <span>Control Perceptivo (Registrar Entrada)</span>
          </button>
        )}
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por correlativo numérico, serial, descripción, orden de compra, factura..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg"
          >
            Buscar
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {/* Filtro Origen / Modalidad de Ingreso */}
          <select
            value={filterOrigen}
            onChange={(e) => setFilterOrigen(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white font-medium"
          >
            <option value="">Modalidad Entrada (Todas)</option>
            {ORIGENES_INGRESO.map((oi) => (
              <option key={oi.value} value={oi.value}>
                {oi.label}
              </option>
            ))}
          </select>

          {/* Filtro Estado del Bien */}
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white font-medium"
          >
            <option value="">Estado del Bien (Todos)</option>
            {ESTADOS_BIEN.map((eb) => (
              <option key={eb.value} value={eb.value}>
                {eb.label}
              </option>
            ))}
          </select>

          {/* Filtro Familias Oficiales */}
          <select
            value={filterFamilia}
            onChange={(e) => setFilterFamilia(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white max-w-xs font-medium"
          >
            <option value="">Familias Oficiales (Todas)</option>
            {FAMILIAS_UNEG.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Bienes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span>Cargando inventario patrimonial...</span>
          </div>
        ) : bienes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="font-semibold text-lg text-gray-700">No se encontraron bienes</p>
            <p className="text-sm">Ajuste los filtros o registre un nuevo bien con el rol de Registrador.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Correlativo</th>
                  <th className="px-4 py-3">Familia / Descripción</th>
                  <th className="px-4 py-3">Serial / Marca / Modelo</th>
                  <th className="px-4 py-3">Modalidad / Documento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Custodio (Ficha)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bienes.map((bien) => (
                  <tr key={bien.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-base text-blue-900">
                        #{bien.correlativo}
                      </div>
                      <span className="text-[10px] text-gray-400 block">
                        {new Date(bien.fecha_registro).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-gray-900 line-clamp-2">{bien.descripcion}</div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Tag size={12} className="text-blue-500 shrink-0" />
                        <span className="font-medium">{bien.familia}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div><span className="font-semibold">Serial:</span> {bien.serial || 'S/N'}</div>
                      <div><span className="font-semibold">Marca:</span> {bien.marca || '-'}</div>
                      <div><span className="font-semibold">Modelo:</span> {bien.modelo || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                          {bien.origen_ingreso}
                        </span>
                        {bien.url_documento_origen && (
                          <a
                            href={bien.url_documento_origen}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            title="Ver documento adjunto"
                          >
                            <Paperclip size={13} />
                          </a>
                        )}
                      </div>
                      {bien.origen_ingreso === 'Compra' && (
                        <div className="text-gray-500 text-[11px] mt-0.5">
                          {bien.orden_compra ? `O/C: ${bien.orden_compra}` : ''}
                          {bien.numero_factura ? ` | Fac: ${bien.numero_factura}` : ''}
                        </div>
                      )}
                      {bien.origen_ingreso === 'Donación' && (
                        <div className="text-gray-500 text-[11px] mt-0.5">
                          {bien.documento_aprobacion ? `Acta: ${bien.documento_aprobacion}` : 'Donación'}
                        </div>
                      )}
                      {bien.origen_ingreso === 'Fabricación' && (
                        <div className="text-emerald-700 text-[11px] mt-0.5 font-medium">
                          Taller UNEG
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block ${getEstadoBadgeClass(
                          bien.estado
                        )}`}
                      >
                        {bien.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-gray-900">{bien.responsable?.nombre || 'Almacén'}</div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <User size={12} /> Ficha: {bien.numero_ficha_responsable || bien.responsable?.numero_ficha || 'N/A'}
                      </div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <MapPin size={12} /> {bien.ubicacion?.nombre}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Incorporación de Bien (Control Perceptivo) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={24} />
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Control Perceptivo / Registro de Entrada</h3>
                  <p className="text-xs text-gray-500">Documento de ingreso condicional y correlativo automático</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateBien} className="mt-4 space-y-5 text-sm">
              {/* Sección 1: Modalidad de Entrada y Documentos Condicionales */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet size={14} /> 1. Modalidad de Ingreso y Soporte Documental
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Origen / Modalidad de Ingreso:
                  </label>
                  <select
                    value={formData.origen_ingreso}
                    onChange={(e) => setFormData({ ...formData, origen_ingreso: e.target.value })}
                    className="w-full border border-blue-300 rounded-lg p-2.5 text-sm bg-white font-semibold text-blue-950 focus:ring-2 focus:ring-blue-600"
                  >
                    {ORIGENES_INGRESO.map((oi) => (
                      <option key={oi.value} value={oi.value}>
                        {oi.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CONDICIONAL 1: COMPRA */}
                {formData.origen_ingreso === 'Compra' && (
                  <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-3">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      Documentos requeridos para Compras (Almacén):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Orden de Compra <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: OC-2024-0452"
                          value={formData.orden_compra}
                          onChange={(e) => setFormData({ ...formData, orden_compra: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          N° de Factura <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: FAC-99021"
                          value={formData.numero_factura}
                          onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Factura</label>
                        <input
                          type="date"
                          value={formData.fecha_adquisicion}
                          onChange={(e) => setFormData({ ...formData, fecha_adquisicion: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CONDICIONAL 2: DONACIÓN */}
                {formData.origen_ingreso === 'Donación' && (
                  <div className="p-3 bg-white rounded-lg border border-amber-200 space-y-3">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-amber-600" />
                      Documento requerido para Donaciones:
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Carta / Acta de Aprobación por la Universidad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Acta Consejo Universitario N° CU-RES-2024-045"
                        value={formData.documento_aprobacion}
                        onChange={(e) => setFormData({ ...formData, documento_aprobacion: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* CONDICIONAL 3: FABRICACIÓN */}
                {formData.origen_ingreso === 'Fabricación' && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>
                        <strong>Fabricación institucional:</strong> No requiere orden de compra ni carta externa. El bien fue producido internamente en dependencias o talleres de la UNEG.
                      </span>
                    </p>
                  </div>
                )}

                {/* CONDICIONAL 4: OTROS */}
                {formData.origen_ingreso === 'Otros' && (
                  <div className="p-3 bg-white rounded-lg border border-purple-200 space-y-3">
                    <p className="text-xs font-bold text-purple-900 flex items-center gap-1">
                      <HelpCircle size={13} className="text-purple-600" />
                      Especificación de entrada alternativa:
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Documento o Número de Referencia (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Resolución de Comodato o Transferencia Ministerial"
                        value={formData.documento_aprobacion}
                        onChange={(e) => setFormData({ ...formData, documento_aprobacion: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Adjuntar archivo escaneado (Factura / Carta / Acta en PDF) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Adjuntar Documento Digital de Respaldo (PDF o Imagen)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setFileToUpload(e.target.files[0])}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Factura digital en PDF para compras, Carta de Aprobación escaneada para donaciones, etc.
                  </p>
                </div>
              </div>

              {/* Sección 2: Identificación y Clasificación */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={14} /> 2. Clasificación Patrimonial UNEG
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Familia Patrimonial UNEG (Lista Oficial)
                  </label>
                  <select
                    value={formData.familia}
                    onChange={(e) => setFormData({ ...formData, familia: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white font-medium"
                  >
                    {FAMILIAS_UNEG.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Correlativo Patrimonial</label>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-1">
                    <Hash size={14} /> Se autogenera número secuencial único
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción del Bien</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Descripción detallada del equipo, características y componentes..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>

              {/* Sección 3: Datos Técnicos y Estado del Bien */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} /> 3. Datos Técnicos y Estado
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Marca</label>
                    <input
                      type="text"
                      placeholder="HP, Dell, etc."
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Modelo</label>
                    <input
                      type="text"
                      placeholder="Modelo fábrica"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Serial (Almacén)</label>
                    <input
                      type="text"
                      placeholder="Serial de fábrica"
                      value={formData.serial}
                      onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Código de Serie</label>
                    <input
                      type="text"
                      placeholder="Lote o serie"
                      value={formData.codigo_serie}
                      onChange={(e) => setFormData({ ...formData, codigo_serie: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado del Bien</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white font-medium"
                  >
                    {ESTADOS_BIEN.map((eb) => (
                      <option key={eb.value} value={eb.value}>
                        {eb.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección 4: Contabilidad, Ubicación y Custodia */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} /> 4. Contabilidad, Destinatario y Custodia
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Recepción (Almacén)</label>
                    <input
                      type="date"
                      value={formData.fecha_recepcion}
                      onChange={(e) => setFormData({ ...formData, fecha_recepcion: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Código Contable</label>
                    <input
                      type="text"
                      placeholder="Ej: 1.2.3.01.05"
                      value={formData.codigo_contable}
                      onChange={(e) => setFormData({ ...formData, codigo_contable: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Depreciación</label>
                    <input
                      type="date"
                      value={formData.fecha_depreciacion}
                      onChange={(e) => setFormData({ ...formData, fecha_depreciacion: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Ubicación Física</label>
                    <select
                      required
                      value={formData.ubicacion_id}
                      onChange={(e) => setFormData({ ...formData, ubicacion_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                    >
                      {ubicaciones.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Responsable de Uso (Destinatario)</label>
                    <select
                      required
                      value={formData.responsable_id}
                      onChange={(e) => handleResponsableChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                    >
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.rol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Número de Ficha del Responsable</label>
                    <input
                      type="text"
                      placeholder="Ej: PROF-1092"
                      value={formData.numero_ficha_responsable}
                      onChange={(e) => setFormData({ ...formData, numero_ficha_responsable: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Motivo / Justificación</label>
                    <input
                      type="text"
                      placeholder={
                        formData.origen_ingreso === 'Donación'
                          ? 'Donante o convenio...'
                          : formData.origen_ingreso === 'Fabricación'
                          ? 'Taller o laboratorio productor...'
                          : 'Motivo de adquisición...'
                      }
                      value={formData.motivo}
                      onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Observaciones</label>
                    <input
                      type="text"
                      placeholder="Notas adicionales..."
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-2 shadow"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Guardar e Incorporar Bien</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
