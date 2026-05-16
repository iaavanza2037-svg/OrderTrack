import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Store, Settings, Menu, X, Download, FileText, LogOut } from 'lucide-react';
import { useState } from 'react';
import { auth, logout } from '../lib/firebase';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = auth.currentUser;

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pedidos', icon: ShoppingCart, label: 'Pedidos' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
    { to: '/tiendas', icon: Store, label: 'Tiendas' },
    { to: '/respaldo', icon: Download, label: 'Respaldo' },
    { to: '/informes', icon: FileText, label: 'Informes' },
    { to: '/configuracion', icon: Settings, label: 'Configuración' },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShoppingCart className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900">OrderTrack Pro</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 md:static md:translate-x-0 bg-white border-r border-[#E2E8F0] w-64 flex-shrink-0 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-4">
          <div className="hidden md:flex items-center gap-3 px-2 mb-10 mt-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <ShoppingCart className="text-white w-6 h-6" />
            </div>
            <span className="font-black text-xl text-slate-900 tracking-tighter">OrderTrack Pro</span>
          </div>

          <nav className="flex-1 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100' 
                    : 'text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`} />
                    <span className="text-sm">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-widest">{user?.email?.split('@')[0]}</p>
                  <p className="text-[9px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[11px] text-slate-600 font-bold tracking-tight">Nube Conectada</span>
              </div>
            </div>

            <button 
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>


      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
