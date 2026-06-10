import { useState, useEffect } from 'react';
import { Flame, FileText, Settings, Soup, Gift } from 'lucide-react';
import * as client from '../api/client';

const FALLBACK_ICONS = {
  Kits: Gift,
  Sedas: FileText,
  Trituradores: Settings,
  Isqueiros: Flame,
  Acessórios: Soup,
};

export default function FilterSection({ activeCategory, onSetCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.fetchCategories()
      .then((data) => setCategories(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="filter-section" />;

  return (
    <div className="filter-section">
      <div className="filter-inner">
        <div className="filter-grid" id="filterGrid">
          <button
            className={`f-btn${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => onSetCategory('all')}
          >
            <span>{categories.length > 0 ? 'Ver Tudo' : 'Todos'}</span>
            <span className="f-count">{categories.reduce((s, c) => s + (c.productCount || 0), 0) || '—'}</span>
          </button>
          {categories.map((cat) => {
            const IconComp = FALLBACK_ICONS[cat.name];
            return (
              <button
                key={cat.slug}
                className={`f-btn${activeCategory === cat.slug ? ' active' : ''}`}
                onClick={() => onSetCategory(cat.slug)}
              >
                {IconComp && <IconComp size={16} aria-hidden="true" />}
                <span>{cat.name}</span>
                <span className="f-count">{cat.productCount || '—'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
