import { useEffect, useState } from 'react';
import { ShoppingCart, Package, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as client from '../api/client';

function fmt(n) { return `R$ ${n.toFixed(2).replace('.', ',')}`; }

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [favorite, setFavorite] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    client.fetchFavorites()
      .then((favs) => setFavoriteIds(new Set(favs.map((f) => f.productId ?? f.id))))
      .catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    setFavorite(favoriteIds.has(product.id));
  }, [favoriteIds, product.id]);

  async function toggleFavorite(e) {
    e.stopPropagation();
    if (!currentUser) { showToast('Faça login para favoritar', 'info'); return; }
    setFavLoading(true);
    try {
      if (favorite) {
        await client.removeFavorite(product.id);
        setFavorite(false);
        setFavoriteIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; });
      } else {
        await client.addFavorite(product.id);
        setFavorite(true);
        setFavoriteIds((prev) => new Set(prev).add(product.id));
      }
    } catch { showToast('Erro ao atualizar favorito', 'error'); }
    finally { setFavLoading(false); }
  }

  function handleAdd() {
    addItem({ ...product, qty: 1, icon: product.icon || 'package' });
    showToast(`${product.name} adicionado ao carrinho`);
  }

  return (
    <article className="pcard">
      <div className="pimg">
        {product.badge && <span className={`bdg ${product.badge}`}>{product.badge === 'sale' ? 'Promo' : product.badge === 'new' ? 'Novo' : product.badge}</span>}
        <button
          className={`pfav ${favorite ? 'pfav-active' : ''}`}
          onClick={toggleFavorite}
          disabled={favLoading}
          aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart size={18} aria-hidden="true" fill={favorite ? 'var(--gold)' : 'none'} />
        </button>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div className="pimg-fallback" style={{ display: product.image ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={44} aria-hidden="true" style={{ color: 'var(--text2)', opacity: 0.5 }} />
        </div>
      </div>
      <div className="pinfo">
        {product.category && <span className="pcat">{product.category}</span>}
        <h3 className="pname">{product.name}</h3>
        <div className="pprice">
          <span className="pcurr">{fmt(product.price)}</span>
          {product.oldPrice && <span className="pold">{fmt(product.oldPrice)}</span>}
        </div>
        <button className="padd" onClick={handleAdd}>
          <ShoppingCart size={16} aria-hidden="true" />
          Adicionar
        </button>
      </div>
    </article>
  );
}
