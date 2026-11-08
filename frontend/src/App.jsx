import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BienesPage from './pages/BienesPage';
import TramitesPage from './pages/TramitesPage';
import AuditoriaPage from './pages/AuditoriaPage';
import UbicacionesPage from './pages/UbicacionesPage';
import UsuariosPage from './pages/UsuariosPage';
import { Loader2 } from 'lucide-react';

function MainLayout() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-blue-900" />
          <span className="text-sm font-semibold text-gray-600">
            Cargando Sistema de Bienes UNEG...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && <DashboardPage setCurrentTab={setCurrentTab} />}
          {currentTab === 'bienes' && <BienesPage />}
          {currentTab === 'tramites' && <TramitesPage />}
          {currentTab === 'auditoria' && <AuditoriaPage />}
          {currentTab === 'ubicaciones' && <UbicacionesPage />}
          {currentTab === 'usuarios' && <UsuariosPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

