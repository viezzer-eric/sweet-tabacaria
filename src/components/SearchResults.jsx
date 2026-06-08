import { useState, useMemo } from 'react';
import { X, Search, SlidersHorizontal } from 'lucide-react';
import { PRODUCTS_DATA, CATEGORY_NAMES } from '../data/products';
import ProductCard from './ProductCard';

const CATEGORIES = ['all', ...new Set(PRODUCTS_DATA.map((p) => p.category))];

export default function SearchResults({ query, onClear }) {
  const [filterCat, setFilterCat] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState('default');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const results = useMemo(() => {
    let list = PRODUCTS_DATA.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );

    if (filterCat !== 'all') {
      list = list.filter((p) => p.category === filterCat);
    }

    if (priceMin !== '') {
      list = list.filter((p) => p.price >= Number(priceMin));
    }
    if (priceMax !== '') {
      list = list.filter((p) => p.price <= Number(priceMax));
    }

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [query, filterCat, priceMin, priceMax, sort]);

  function resetFilters() {
    setFilterCat('all');
    setPriceMin('');
    setPriceMax('');
    setSort('default');
  }

  const filterContent = (
    <>
      <div className="filter-group">
        <h4 className="filter-group-title">Categoria</h4>
        {CATEGORIES.map((cat) => (
          <label key={cat} className="filter-check">
            <input
              type="radio"
              name="filterCat"
              checked={filterCat === cat}
              onChange={() => setFilterCat(cat)}
            />
            <span>{CATEGORY_NAMES[cat] || cat}</span>
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h4 className="filter-group-title">Preço</h4>
        <div className="filter-price-row">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="filter-price-input"
            min="0"
          />
          <span>até</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="filter-price-input"
            min="0"
          />
        </div>
      </div>

      <button className="filter-clear" onClick={resetFilters}>
        Limpar Filtros
      </button>
    </>
  );

  return (
    <div className="search-page">
      <div className="search-hdr">
        <div className="search-hdr-inner">
          {query ? (
            <h2>
              Resultados para: <strong>“{query}”</strong>
            </h2>
          ) : (
            <h2>Todos os Produtos</h2>
          )}
          <span className="cnt">{results.length} {results.length === 1 ? 'item' : 'itens'} encontrado{results.length !== 1 ? 's' : ''}</span>
          {query ? (
            <button className="search-back" onClick={onClear}>
              <X size={14} aria-hidden="true" />
              Limpar busca
            </button>
          ) : null}
        </div>
      </div>

      <div className="search-body">
        <aside className="filter-sidebar">
          {filterContent}
        </aside>

        <button className="filter-toggle" onClick={() => setDrawerOpen(true)}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filtros
        </button>

        <div className="search-main">
          <div className="search-main-hdr">
            <span className="cnt">{results.length} {results.length === 1 ? 'item' : 'itens'}</span>
            <select
              className="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">Ordenar por</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
            </select>
          </div>

          <div className="pgrid" id="searchGrid">
            {results.length === 0 ? (
              <div className="empty">
                <Search size={44} className="ei" aria-hidden="true" />
                <h3>Nenhum produto encontrado para “{query}”</h3>
                <p className="empty-sub">Tente buscar por outro termo ou limpe os filtros.</p>
              </div>
            ) : (
              results.map((p) => <ProductCard key={p.id} product={p} />)
            )}
          </div>
        </div>
      </div>

      <div
        className={`filter-drawer-ov${drawerOpen ? ' on' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`filter-drawer${drawerOpen ? ' on' : ''}`}>
        <div className="filter-drawer-hd">
          <span>Filtros</span>
          <button className="filter-drawer-close" onClick={() => setDrawerOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="filter-drawer-body">
          {filterContent}
        </div>
      </aside>
    </div>
  );
}
