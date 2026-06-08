export default function Footer() {
  return (
    <footer>
      <div className="foot-in">
        <div className="fc">
          <div className="brand-title">Sweet Headshop</div>
          <span className="sub-text">CNPJ: 38.240.088/0001-91</span>
          <p style={{ marginTop: 8 }}>
            📍 R. Crasso, 195<br />
            Vila Romana | Água Branca<br />
            São Paulo - SP<br />
            CEP: 05043-010
          </p>
          <div className="foot-socials">
            <a href="#" className="social-link" title="Facebook">📘</a>
            <a href="#" className="social-link" title="Instagram">
              📸 <span style={{ fontSize: 12 }}>Nosso Instagram!</span>
            </a>
          </div>
        </div>

        <div className="fc">
          <h4>Atendimento Varejo</h4>
          <a href="https://wa.me/5511976519275" target="_blank" rel="noopener noreferrer">
            📞 (11) 97651-9275
          </a>
          <a href="mailto:contato@tabacariasweet.com.br">
            ✉️ contato@tabacariasweet.com.br
          </a>
          <h4 style={{ marginTop: 14 }}>Minha Conta</h4>
          <a href="#">👤 Login da conta</a>
          <a href="#">📦 Minha conta</a>
        </div>

        <div className="fc">
          <h4>Institucional</h4>
          <a href="#">🔒 Privacidade &amp; Segurança</a>
          <a href="#">🔄 Trocas &amp; Devoluções</a>
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
              📅 Aviso de Entrega
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
              alt="Sweet Headshop Loja Física"
            />
            <div className="shop-card-body">Venha conhecer nosso espaço na Vila Romana</div>
          </div>
        </div>
      </div>

      <div className="foot-bot">
        © 2026 Sweet Headshop · Venda proibida para menores de 18 anos
      </div>
    </footer>
  );
}
