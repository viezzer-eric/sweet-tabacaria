import { createContext, useContext, useState, useEffect } from 'react';
import * as client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('capivara_token');
    if (!token) {
      setLoading(false);
      return;
    }
    client.getMe()
      .then((u) => setCurrentUser(u))
      .catch(() => client.logout())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    try {
      const data = await client.login(email, password);
      setCurrentUser(data.user);
      setError('');
      return { success: true, role: data.user.role };
    } catch (err) {
      setError(err.message);
      return { success: false };
    }
  }

  async function register(data) {
    try {
      const res = await client.register(data.name, data.email, data.password, data.phone, data.cpf);
      setCurrentUser(res.user);
      setError('');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function updateProfile(data) {
    setCurrentUser((prev) => prev ? { ...prev, ...data } : prev);
  }

  function logout() {
    client.logout();
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, register, updateProfile, logout, error, setError, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
