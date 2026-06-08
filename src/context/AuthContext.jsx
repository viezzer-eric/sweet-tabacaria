import { createContext, useContext, useState } from 'react';

const MOCK_USERS = [
  { id: 1, name: 'Admin Sweet', email: 'admin@sweaheadshop.com', password: 'admin123', phone: '(11) 99999-9999', role: 'admin', address: {} },
  { id: 2, name: 'Lucas Ferreira', email: 'lucas@email.com', password: '123456', phone: '(11) 98765-4321', role: 'client', address: { street: 'R. das Flores', number: '42', complement: '', neighborhood: 'Perdizes', cep: '05000-000' } },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sweet_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState('');

  function login(email, password) {
    const user = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('sweet_user', JSON.stringify(user));
      setError('');
      return { success: true, role: user.role };
    }
    return { success: false };
  }

  function register(data) {
    const exists = MOCK_USERS.some((u) => u.email === data.email);
    if (exists) {
      return { success: false, error: 'Este e-mail já está cadastrado.' };
    }
    const newUser = { id: Date.now(), ...data, role: 'client', address: {} };
    MOCK_USERS.push(newUser);
    setCurrentUser(newUser);
    localStorage.setItem('sweet_user', JSON.stringify(newUser));
    setError('');
    return { success: true };
  }

  function updateProfile(data) {
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem('sweet_user', JSON.stringify(updated));
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('sweet_user');
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, register, updateProfile, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
