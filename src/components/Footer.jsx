import { MapPin, Phone, Mail, User, Package, Lock, RefreshCw, Calendar, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer>
      <div className="foot-in">
        <div className="fc">
          <div className="brand-title">Capivara Smoke</div>
          <span className="sub-text">CNPJ: 38.240.088/0001-91</span>
          <p style={{ marginTop: 8 }}>
            <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} aria-hidden="true" />
            R. Crasso, 195<br />
            Vila Romana | Água Branca<br />
            São Paulo - SP<br />
            CEP: 05043-010
          </p>
          <div className="foot-socials">
            <a href="#" className="social-link" title="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z"/></svg>
            </a>
            <a href="#" className="social-link" title="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              <span style={{ fontSize: 12 }}>Nosso Instagram!</span>
            </a>
          </div>
        </div>

        <div className="fc">
          <h4>Atendimento Varejo</h4>
          <a href="https://wa.me/5511976519275" target="_blank" rel="noopener noreferrer">
            <Phone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} aria-hidden="true" />
            (11) 97651-9275
          </a>
          <a href="mailto:contato@capivarasmoke.com.br">
            <Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} aria-hidden="true" />
            contato@capivarasmoke.com.br
          </a>
          <h4 style={{ marginTop: 14 }}>Minha Conta</h4>
          <a href="#">
            <User size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} aria-hidden="true" />
            Login da conta
          </a>
          <a href="#">
            <Package size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} aria-hidden="true" />
            Minha conta
          </a>
        </div>

        <div className="fc">
          <h4>Institucional</h4>
          <a href="#">
            <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} aria-hidden="true" />
            Privacidade &amp; Segurança
          </a>
          <a href="#">
            <RefreshCw size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} aria-hidden="true" />
            Trocas &amp; Devoluções
          </a>
          <div
            style={{
              marginTop: 'auto',
              background: 'var(--bg3)',
              padding: 12,
              borderRadius: 6,
              border: '1px solid var(--line2)',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--gold-l)', fontWeight: 500 }}>
              <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} aria-hidden="true" />
              Aviso de Entrega
            </p>
            <p style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
              Pedidos feitos no final de semana e feriado serão entregues no próximo dia útil.
            </p>
          </div>
        </div>

        <div className="fc">
          <h4>Visite nossa loja física</h4>
          <div className="shop-card">
            <img
              src="https://images.unsplash.com/photo-1603344185739-e022dfccbc44?q=80&w=600&auto=format&fit=crop"
              alt="Capivara Smoke Loja Física"
            />
            <div className="shop-card-body">Venha conhecer nosso espaço na Vila Romana</div>
          </div>
        </div>
      </div>

      <div className="foot-bot">
        © 2026 Capivara Smoke · Venda proibida para menores de 18 anos
      </div>
    </footer>
  );
}
