import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Header({ onToggleCart, onSearch, theme, onToggleTheme }) {
  return (
    <header>
      <div className="hdr">
        <Link to="/" className="logo">
          <span className="logo-name">Sweet Headshop</span>
          <span className="logo-tag">Delivery · Lapa · SP</span>
        </Link>

        <div className="search-box">
          <span className="si">⌕</span>
          <input
            type="text"
            id="searchInput"
            placeholder="Buscar produtos ou kits…"
            onChange={(e) => onSearch(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="hdr-r">
          <button className="icon-btn" id="themeBtn" onClick={onToggleTheme}>
            {theme === 'dark' ? '☀' : '☽'}
          </button>
          <a
            className="icon-btn wpp"
            href="https://wa.me/5511976519275"
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 <span className="wpp-txt">(11) 97651-9275</span>
          </a>
          <button className="icon-btn" onClick={onToggleCart} id="cartBtn">
            🛒 <CartBadge />
          </button>
        </div>
      </div>
    </header>
  );
}

function CartBadge() {
  const { totalCount } = useCart();
  return (
    <span className="cart-badge" id="cartCount">
      {totalCount}
    </span>
  );
}
