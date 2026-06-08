import { Truck, MessageCircle, CreditCard, Lock } from 'lucide-react';

const BENEFITS = [
  { icon: Truck, title: 'Delivery Rápido', desc: 'Lapa · Perdizes · V. Madalena' },
  { icon: MessageCircle, title: 'Atendimento WhatsApp', desc: 'Resposta em minutos' },
  { icon: CreditCard, title: 'Pagamento Fácil', desc: 'Pix · Cartão · Dinheiro' },
  { icon: Lock, title: 'Compra Discreta', desc: 'Embalagem sem identificação' },
];

export default function Benefits() {
  return (
    <section className="benefits">
      {BENEFITS.map((b) => {
        const IconComp = b.icon;
        return (
          <div key={b.title} className="ben">
            <IconComp size={22} className="ben-ico" aria-hidden="true" />
            <div className="ben-txt">
              <strong>{b.title}</strong>
              {b.desc}
            </div>
          </div>
        );
      })}
    </section>
  );
}
