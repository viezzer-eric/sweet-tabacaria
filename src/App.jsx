import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import HomePage from './pages/HomePage';
import { useState, useEffect } from 'react';

export default function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function handleToggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return (
    <BrowserRouter>
      <CartProvider>
        <HomePage theme={theme} onToggleTheme={handleToggleTheme} />
      </CartProvider>
    </BrowserRouter>
  );
}