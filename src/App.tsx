import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/CRM/Products';
import AuthCallback from './pages/AuthCallback';
import { supabase } from './lib/supabase';
import { User } from './types';

// CRM Pages placeholders
const Placeholder = ({ name }: { name: string }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
    <h1 className="text-2xl font-bold text-slate-800 mb-4">{name}</h1>
    <div className="h-64 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
      Módulo em desarrollo - Próximamente integración completa de datos.
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Escuchar cambios de autenticación en Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Supabase Auth Event:", event);
      if (event === 'SIGNED_IN' && session && !localStorage.getItem('token')) {
        try {
          const res = await fetch("/api/auth/oauth-exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: session.user.email, 
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
            }),
          });
          if (res.ok) {
            const data = await res.json();
            handleLogin(data.token, data.user);
          }
        } catch (err) {
          console.error("Exchange error in onAuthStateChange:", err);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            handleLogout();
          }
        } catch (err) {
          handleLogout();
        }
      }
      setReady(true);
    };
    fetchMe();
  }, [token]);

  const handleLogin = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login'; // Force a full clean redirect
  };

  if (!ready) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/auth/callback" element={<AuthCallback onLogin={handleLogin} />} />
        
        <Route path="/*" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="dashboard" element={<Dashboard user={user} />} />
                <Route path="crm/prospects" element={<Placeholder name="Gestión de Prospectos" />} />
                <Route path="crm/customers" element={<Placeholder name="Directorio de Clientes" />} />
                <Route path="crm/products" element={<Products />} />
                <Route path="crm/quotes" element={<Placeholder name="Cotizaciones y Presupuestos" />} />
                <Route path="crm/sales" element={<Placeholder name="Ventas y Pagos" />} />
                <Route path="crm/technical" element={<Placeholder name="Órdenes de Servicio Técnico" />} />
                <Route path="admin/users" element={<Placeholder name="Administración de Usuarios" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}
