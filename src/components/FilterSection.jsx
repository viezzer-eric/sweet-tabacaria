import { PRODUCTS_DATA, CATEGORY_NAMES } from '../data/products';

export default function FilterSection({ activeCategory, onSetCategory }) {
  const categories = ['all', ...new Set(PRODUCTS_DATA.map((p) => p.category))];

  return (
    <div className="filter-section">
      <div className="filter-inner">
        <div className="filter-grid" id="filterGrid">
          {categories.map((cat) => {
            const count =
              cat === 'all'
                ? PRODUCTS_DATA.length
                : PRODUCTS_DATA.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                className={`f-btn${activeCategory === cat ? ' active' : ''}`}
                onClick={() => onSetCategory(cat)}
              >
                <span>{CATEGORY_NAMES[cat] || cat}</span>
                <span className="f-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
