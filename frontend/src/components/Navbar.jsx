import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, User } from 'lucide-react';

const roleColors = {
  Jefe: 'bg-purple-100 text-purple-800 border-purple-300',
  Administrador: 'bg-blue-100 text-blue-800 border-blue-300',
  Registrador: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Documentalista: 'bg-amber-100 text-amber-800 border-amber-300',
  Auditor: 'bg-rose-100 text-rose-800 border-rose-300',
  'Responsable de Unidad': 'bg-cyan-100 text-cyan-800 border-cyan-300',
};

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-900 text-white p-2 rounded-lg font-bold text-lg tracking-wider flex items-center gap-2">
            <span>🏛️</span> UNEG
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">
              Sistema de Bienes Públicos
            </h1>
            <p className="text-xs text-gray-500">Gestión de Inventario y Patrimonio</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-gray-800 flex items-center justify-end gap-1">
                <User size={14} className="text-gray-500" /> {user.nombre}
              </span>
              <span className="text-xs text-gray-500">C.I. {user.cedula}</span>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
                roleColors[user.rol] || 'bg-gray-100 text-gray-800'
              }`}
            >
              <Shield size={12} />
              {user.rol}
            </span>

            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

