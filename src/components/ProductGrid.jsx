import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import * as client from '../api/client';
import { formatApiProduct } from '../data/products';
import ProductCard from './ProductCard';

export default function ProductGrid({ activeCategory, searchQuery }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('default');

  useEffect(() => {
    setLoading(true);
    const filters = { category: activeCategory !== 'all' ? activeCategory : undefined };
    if (sort !== 'default') filters.sort = sort;
    client.fetchProducts(filters)
      .then((data) => setProducts((data?.items || data || []).map(formatApiProduct)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCategory, sort]);

  const filtered = searchQuery
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  if (loading) {
    return (
      <main>
        <div className="sec-head"><h2>Nossos Produtos</h2></div>
        <div className="pgrid" id="prodGrid">
          {[1,2,3,4].map((i) => (
            <div key={i} className="pcard pcard-skeleton">
              <div className="pimg" style={{ background: 'var(--bg3)', height: 150 }} />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="sec-head">
        <h2>Nossos Produtos</h2>
        <div className="sec-head-r">
          <span className="cnt" id="prodCount">
            {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
          </span>
          <select
            id="sortSelect"
            className="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="default">Ordenar por</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
          </select>
        </div>
      </div>

      <div className="pgrid" id="prodGrid">
        {filtered.length === 0 ? (
          <div className="empty">
            <Package size={44} className="ei" aria-hidden="true" />
            <h3>Nenhum produto encontrado</h3>
          </div>
        ) : (
          filtered.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </main>
  );
}
