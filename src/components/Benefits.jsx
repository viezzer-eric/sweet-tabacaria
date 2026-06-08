const BENEFITS = [
  { icon: '🚚', title: 'Delivery Rápido', desc: 'Lapa · Perdizes · V. Madalena' },
  { icon: '💬', title: 'Atendimento WhatsApp', desc: 'Resposta em minutos' },
  { icon: '💳', title: 'Pagamento Fácil', desc: 'Pix · Cartão · Dinheiro' },
  { icon: '🔒', title: 'Compra Discreta', desc: 'Embalagem sem identificação' },
];

export default function Benefits() {
  return (
    <section className="benefits">
      {BENEFITS.map((b) => (
        <div key={b.title} className="ben">
          <span className="ben-ico">{b.icon}</span>
          <div className="ben-txt">
            <strong>{b.title}</strong>
            {b.desc}
          </div>
        </div>
      ))}
    </section>
  );
}
