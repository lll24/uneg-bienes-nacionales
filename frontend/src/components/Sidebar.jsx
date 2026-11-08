import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Boxes, FileText, ClipboardCheck, Building2, Users } from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const { isAuditor, isAdmin, isJefe } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Tablero Principal', icon: LayoutDashboard },
    { id: 'bienes', label: 'Inventario de Bienes', icon: Boxes },
    { id: 'tramites', label: 'Trámites y Flujos', icon: FileText },
    { id: 'auditoria', label: 'Auditoría y Cruces', icon: ClipboardCheck },
    ...(isAdmin || isJefe ? [
      { id: 'ubicaciones', label: 'Ubicaciones', icon: Building2 },
      { id: 'usuarios', label: 'Usuarios y Roles', icon: Users },
    ] : [])
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-800">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Módulos del Sistema</p>
      </div>
      <nav className="p-2 space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <p>UNEG Patrimonio v1.0 MVP</p>
        <p>© Universidad Nacional Experimental de Guayana</p>
      </div>
    </aside>
  );
}

