import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ToastProvider from './context/ToastContext';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminSetupPage from './pages/AdminSetupPage';
import LoginPage from './pages/LoginPage';
import UserProfile from './pages/UserProfile';
import AdminRegisterPage from './pages/AdminRegisterPage';


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/conta" element={<UserProfile />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/admin/cadastro" element={<AdminRegisterPage />} />
            <Route path="/admin/setup" element={<AdminSetupPage />} />
            <Route path="/admin" element={<AdminDashboard />} />

          </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}