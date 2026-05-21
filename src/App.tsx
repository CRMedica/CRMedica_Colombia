import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/CRM/Products';
import Prospects from './pages/CRM/Prospects';
import Customers from './pages/CRM/Customers';
import Quotes from './pages/CRM/Quotes';
import Sales from './pages/CRM/Sales';
import Technical from './pages/CRM/Technical';
import UsersAdmin from './pages/CRM/UsersAdmin';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [ready, setReady] = useState(false);

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

  const handleLogout = () => {
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
        
        <Route path="/*" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="dashboard" element={<Dashboard user={user} />} />
                <Route path="crm/prospects" element={<Prospects />} />
                <Route path="crm/customers" element={<Customers />} />
                <Route path="crm/products" element={<Products />} />
                <Route path="crm/quotes" element={<Quotes />} />
                <Route path="crm/sales" element={<Sales />} />
                <Route path="crm/technical" element={<Technical />} />
                <Route path="admin/users" element={<UsersAdmin />} />
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
