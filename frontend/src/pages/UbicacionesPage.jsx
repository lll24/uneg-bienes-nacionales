import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Building2, Plus, Loader2 } from 'lucide-react';

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getUbicaciones();
      setUbicaciones(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSubmitting(true);
    try {
      await api.createUbicacion({ nombre });
      setNombre('');
      loadData();
    } catch (err) {
      alert(err.message || 'Error al crear ubicación');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Ubicaciones y Sedes Universitarias</h2>
        <p className="text-sm text-gray-500">Gestión de áreas físicas, departamentos y laboratorios</p>
      </div>

      {/* Formulario Crear */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            required
            placeholder="Ej: Campus Atlántico - Edificio General Piso 2, Laboratorio de Robótica"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            <span>Registrar Ubicación</span>
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando ubicaciones...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ubicaciones.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{u.nombre}</h4>
                    <span className="text-xs text-gray-400">ID: {u.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

