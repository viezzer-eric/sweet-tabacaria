import { useState, useEffect, useCallback, useRef } from 'react';
import { KITS_DATA } from '../data/products';
import { useCart } from '../context/CartContext';

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const { addItem } = useCart();
  const timeoutRef = useRef(null);

  // Avança o slide de forma cíclica
  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % KITS_DATA.length);
  }, []);

  // Volta o slide
  const prev = () => {
    resetTimeout();
    setActive((prev) => (prev - 1 + KITS_DATA.length) % KITS_DATA.length);
  };

  // Trata o clique nos dots (bolinhas)
  const handleDotClick = (index) => {
    resetTimeout();
    setActive(index);
  };

  // Função para resetar o temporizador quando houver interação manual
  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
    }
  };

  // Gerencia o autoplay de 5 segundos
  useEffect(() => {
    timeoutRef.current = setInterval(next, 5000);
    return () => resetTimeout();
  }, [next]);

  function fmt(n) {
    return `R$ ${n.toFixed(2).replace('.', ',')}`;
  }

  return (
    <div className="hero-wrap hero-large">
      <div className="hero-slider">
        <div id="heroSlides">
          {KITS_DATA.map((k, i) => (
            <div
              key={k.id}
              className={`hero-slide${i === active ? ' active' : ''}`}
            >
              {/* Lado Esquerdo: Conteúdo textual expandido */}
              <div className="hc hc-large">
                <span className="kit-tag">🔥 Kit Promocional</span>
                <h2>{k.name}</h2>
                <p>{k.desc}</p>
                
                <div className="hero-price-row">
                  <span className="hp-curr">{fmt(k.price)}</span>
                  {k.oldPrice && (
                    <span className="hp-old">{fmt(k.oldPrice)}</span>
                  )}
                </div>

                <button
                  className="btn-gold btn-large"
                  onClick={() =>
                    addItem({
                      id: k.id,
                      name: k.name,
                      price: k.price,
                      icon: k.icon,
                    })
                  }
                >
                  Garantir Kit
                </button>
              </div>

              {/* Lado Direito: Imagem/Ícone ampliado */}
              <div className="hi hi-large">{k.icon}</div>
            </div>
          ))}
        </div>

        {/* Setas de navegação */}
        <button className="sarr p" onClick={prev} aria-label="Slide anterior">
          ‹
        </button>
        <button className="sarr n" onClick={next} aria-label="Próximo slide">
          ›
        </button>

        {/* Paginação (Dots) */}
        <div className="sdots" id="sliderDots">
          {KITS_DATA.map((_, i) => (
            <button
              key={i}
              className={`sdot${i === active ? ' on' : ''}`}
              onClick={() => handleDotClick(i)}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}