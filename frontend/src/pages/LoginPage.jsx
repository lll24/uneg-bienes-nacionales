import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, UserCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(cedula, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickCedula, quickPassword) => {
    setCedula(quickCedula);
    setPassword(quickPassword);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-8 text-white text-center">
          <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-sm mb-3">
            <span className="text-4xl">🏛️</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Bienes Públicos UNEG</h2>
          <p className="text-blue-200 text-sm mt-1">Control Patrimonial e Inventario Universitario</p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Cédula de Identidad
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ej. V-00000001"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm outline-none transition-all pl-10"
                />
                <UserCheck size={18} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm outline-none transition-all pl-10"
                />
                <KeyRound size={18} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <Shield size={18} />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Accesos rápidos de prueba */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-medium mb-3 text-center">
              Acceso rápido para probar los 6 roles institucionales (RBAC):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('V-00000001', 'Admin1234!')}
                className="p-2 border border-blue-200 bg-blue-50/50 hover:bg-blue-100 rounded-lg text-blue-900 font-medium text-left transition-all"
              >
                <div className="font-bold flex items-center gap-1">⚙️ Admin</div>
                <div className="text-[10px] text-gray-500">V-00000001</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('V-00000002', 'Jefe1234!')}
                className="p-2 border border-purple-200 bg-purple-50/50 hover:bg-purple-100 rounded-lg text-purple-900 font-medium text-left transition-all"
              >
                <div className="font-bold flex items-center gap-1">👑 Jefe</div>
                <div className="text-[10px] text-gray-500">V-00000002</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('V-00000003', 'Reg1234!')}
                className="p-2 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 rounded-lg text-emerald-900 font-medium text-left transition-all"
              >
                <div className="font-bold flex items-center gap-1">📝 Registrador</div>
                <div className="text-[10px] text-gray-500">V-00000003</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('V-00000004', 'Doc1234!')}
                className="p-2 border border-amber-200 bg-amber-50/50 hover:bg-amber-100 rounded-lg text-amber-900 font-medium text-left transition-all"
              >
                <div className="font-bold flex items-center gap-1">📂 Documentalista</div>
                <div className="text-[10px] text-gray-500">V-00000004</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('V-00000005', 'Aud1234!')}
                className="p-2 border border-rose-200 bg-rose-50/50 hover:bg-rose-100 rounded-lg text-rose-900 font-medium text-left transition-all"
              >
                <div className="font-bold flex items-center gap-1">🔍 Auditor</div>
                <div className="text-[10px] text-gray-500">V-00000005</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('V-00000006', 'Rpu1234!')}
                className="p-2 border border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100 rounded-lg text-cyan-900 font-medium text-left transition-all"
              >
                <div className="font-bold flex items-center gap-1">👤 RPU (Profesor)</div>
                <div className="text-[10px] text-gray-500">V-00000006</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

