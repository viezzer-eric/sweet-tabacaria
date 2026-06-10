import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Search, Gift, User, LogOut, KeyRound, FileText, MessageCircle, ShoppingCart, Wrench, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header({ onToggleCart, onSearch, onSearchSubmit, onShowProducts }) {
  const { currentUser, logout } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    setSidebarOpen(false);
    navigate('/');
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  const initials = currentUser
    ? currentUser.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <>
      <header>
        <div className="hdr">
          <Link to="/" className="logo">
            <span className="logo-name">Capivara Smoke</span>
            <span className="logo-tag">Delivery · Lapa · SP</span>
          </Link>

          <div className="search-box">
            <Search size={16} className="si" aria-hidden="true" />
            <input
              type="text"
              id="searchInput"
              placeholder="Buscar produtos ou kits…"
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearchSubmit?.(e.target.value);
                }
              }}
              autoComplete="off"
            />
          </div>

          <nav className="hdr-nav">
            <Link to="/">Início</Link>
            <a href="/" onClick={(e) => { e.preventDefault(); onShowProducts?.(); }}>Produtos</a>
            <Link to="/#kits">Kits</Link>
          </nav>

          <div className="hdr-r">
            {currentUser ? (
              <Link to="/conta" className="hdr-link">
                <User size={16} aria-hidden="true" />
                {currentUser.name.split(' ')[0]}
              </Link>
            ) : (
              <>
                <Link to="/admin/cadastro" className="hdr-sell-link">
                  <Store size={16} aria-hidden="true" />
                  Criar minha loja
                </Link>
                <Link to="/login" className="hdr-link">
                  <KeyRound size={16} aria-hidden="true" />
                  Entrar
                </Link>
              </>
            )}

            <button className="icon-btn hamburger" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
              <Menu size={18} />
            </button>

            <button className="icon-btn" onClick={onToggleCart} id="cartBtn" aria-label="Abrir carrinho">
              <ShoppingCart size={18} />
              {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <div className={`sidebar-ov${sidebarOpen ? ' on' : ''}`} onClick={closeSidebar} />

      <aside className={`sidebar${sidebarOpen ? ' on' : ''}`}>
        <div className="sidebar-hd">
          <span>Menu</span>
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-body">
          <Link to="/" className="sidebar-link" onClick={closeSidebar}>
            <Home size={18} className="sli" aria-hidden="true" />
            Início
          </Link>
          <a href="/" className="sidebar-link" onClick={(e) => { e.preventDefault(); closeSidebar(); onShowProducts?.(); }}>
            <Search size={18} className="sli" aria-hidden="true" />
            Produtos
          </a>
          <Link to="/#kits" className="sidebar-link" onClick={closeSidebar}>
            <Gift size={18} className="sli" aria-hidden="true" />
            Kits
          </Link>

          <div className="sidebar-divider" />

          {currentUser ? (
            <>
              <Link to="/conta" className="sidebar-link" onClick={closeSidebar}>
                <User size={18} className="sli" aria-hidden="true" />
                Minha Conta
              </Link>
              {currentUser.role === 'fornecedor' && (
                <Link to="/admin" className="sidebar-link" onClick={closeSidebar}>
                  <Wrench size={18} className="sli" aria-hidden="true" />
                  Painel Fornecedor
                </Link>
              )}
              <button className="sidebar-link" onClick={handleLogout}>
                <LogOut size={18} className="sli" aria-hidden="true" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="sidebar-link" onClick={closeSidebar}>
                <KeyRound size={18} className="sli" aria-hidden="true" />
                Entrar
              </Link>
              <Link to="/login" className="sidebar-link" onClick={closeSidebar}>
                <FileText size={18} className="sli" aria-hidden="true" />
                Criar Conta
              </Link>
              <Link to="/admin/cadastro" className="sidebar-link" onClick={closeSidebar}>
                <Store size={18} className="sli" aria-hidden="true" />
                Quero Vender
              </Link>
            </>
          )}
        </div>

        <a
          className="wpp-fixed"
          href="https://wa.me/5511976519275"
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={18} aria-hidden="true" />
          Fale conosco no WhatsApp
        </a>

        {currentUser && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{currentUser.name}</span>
              <span className="sidebar-user-email">{currentUser.email}</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
