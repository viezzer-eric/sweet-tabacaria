import { useState } from 'react';
import AnnouncementBar from '../components/AnnouncementBar';
import Header from '../components/Header';
import FilterSection from '../components/FilterSection';
import HeroSlider from '../components/HeroSlider';
import Benefits from '../components/Benefits';
import ProductGrid from '../components/ProductGrid';
import CartDrawer from '../components/CartDrawer';
import Footer from '../components/Footer';

export default function HomePage({ theme, onToggleTheme }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <AnnouncementBar />
      <Header
        onToggleCart={() => setCartOpen((o) => !o)}
        onSearch={setSearchQuery}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <FilterSection
        activeCategory={activeCategory}
        onSetCategory={setActiveCategory}
      />
      <HeroSlider />
      <Benefits />
      <ProductGrid activeCategory={activeCategory} searchQuery={searchQuery} />
      <Footer />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
