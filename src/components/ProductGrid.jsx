import { useState } from 'react';
import { Package } from 'lucide-react';
import { PRODUCTS_DATA } from '../data/products';
import ProductCard from './ProductCard';

export default function ProductGrid({ activeCategory, searchQuery }) {
  const [sort, setSort] = useState('default');

  let filtered = PRODUCTS_DATA.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);

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
