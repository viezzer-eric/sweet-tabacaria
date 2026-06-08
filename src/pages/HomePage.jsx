import { useState } from 'react';
import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import FilterSection from '../components/FilterSection';
import HeroSlider from '../components/HeroSlider';
import Benefits from '../components/Benefits';
import ProductGrid from '../components/ProductGrid';
import SearchResults from '../components/SearchResults';
import CartDrawer from '../components/CartDrawer';
import Footer from '../components/Footer';

export default function HomePage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  function handleSearchSubmit(query) {
    setSubmittedQuery(query.trim());
    setShowSearch(true);
  }

  function handleClearSearch() {
    setSubmittedQuery('');
    setSearchQuery('');
    setShowSearch(false);
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
  }

  function handleShowProducts() {
    setSubmittedQuery('');
    setSearchQuery('');
    setShowSearch(true);
  }

  return (
    <>
      <AnnouncementBar />
      <Header
        onToggleCart={() => setCartOpen((o) => !o)}
        onSearch={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onShowProducts={handleShowProducts}
      />

      {showSearch ? (
        <SearchResults query={submittedQuery} onClear={handleClearSearch} />
      ) : (
        <>
          <FilterSection
            activeCategory={activeCategory}
            onSetCategory={setActiveCategory}
          />
          <section id="kits">
            <HeroSlider />
          </section>
          <Benefits />
          <section id="produtos">
            <ProductGrid activeCategory={activeCategory} searchQuery={searchQuery} />
          </section>
        </>
      )}

      <Footer />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
