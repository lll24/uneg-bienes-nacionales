import React, { useEffect, useState } from 'react';
import { api, getAuthToken } from '../api/client';
import { Users, UserPlus, Shield, Loader2 } from 'lucide-react';

const ROLES = [
  'Jefe',
  'Administrador',
  'Registrador',
  'Documentalista',
  'Auditor',
  'Responsable de Unidad',
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    rol: 'Registrador',
    password: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);
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
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al crear usuario');
      }
      setIsModalOpen(false);
      setForm({ nombre: '', cedula: '', rol: 'Registrador', password: '' });
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios y Asignación de Roles (RBAC)</h2>
          <p className="text-sm text-gray-500">Gestión de credenciales institucionales y perfiles de acceso</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold text-sm shadow flex items-center gap-2"
        >
          <UserPlus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>
        ) : (
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
              <tr>
                <th className="px-4 py-3">Nombre Completo</th>
                <th className="px-4 py-3">Cédula</th>
                <th className="px-4 py-3">Rol Institucional</th>
                <th className="px-4 py-3">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{u.nombre}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{u.cedula}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-700 font-medium text-xs">Activo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nuevo Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Registrar Nuevo Usuario</h3>
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Prof. Carlos Mendoza"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cédula de Identidad</label>
                <input
                  type="text"
                  required
                  placeholder="V-12345678"
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rol en el Sistema</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contraseña Inicial</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

