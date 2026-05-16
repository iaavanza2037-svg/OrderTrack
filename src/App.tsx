/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './hooks/useStore';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PedidosPage } from './pages/PedidosPage';
import { ClientesPage } from './pages/ClientesPage';
import { TiendasPage } from './pages/TiendasPage';
import { RespaldoPage } from './pages/RespaldoPage';
import { InformesPage } from './pages/InformesPage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { Login } from './components/Login';
import { auth, getRedirectResult } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // Primero manejamos resultados de redirección (importante para móviles)
    getRedirectResult(auth).catch((error) => {
      console.error("Error en resultado de redirección:", error);
    });

    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoadingAuth(false);
    });
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <StoreProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="tiendas" element={<TiendasPage />} />
            <Route path="respaldo" element={<RespaldoPage />} />
            <Route path="informes" element={<InformesPage />} />
            <Route path="configuracion" element={<ConfiguracionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </StoreProvider>
    </Router>
  );
}


