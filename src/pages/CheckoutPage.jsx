import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const VALID_COUPONS = {
  'SWEET10': { type: 'percent', value: 10, label: '10% de desconto' },
  'BEMVINDO': { type: 'fixed', value: 15, label: 'R$ 15,00 de desconto' },
  'FRETE0': { type: 'shipping', value: 0, label: 'Frete grátis' },
};

function fmt(n) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

function PixIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L7 7H4C2.9 7 2 7.9 2 9v6c0 1.1.9 2 2 2h3l5 5 5-5h3c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-3l-5-5z" fill="none"/>
      <path d="M9.5 15.5L7 13l-2 2 2 2 2.5-1.5z" fill="currentColor"/>
      <path d="M14.5 15.5l2.5-1.5 2 2-2 2-2.5-1.5z" fill="currentColor"/>
      <path d="M9.5 8.5L7 11l-2-2 2-2 2.5 1.5z" fill="currentColor"/>
      <path d="M14.5 8.5l2.5 1.5 2-2-2-2-2.5 1.5z" fill="currentColor"/>
    </svg>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [createAccount, setCreateAccount] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [cep, setCep] = useState('');

  const [pixCopied, setPixCopied] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const SHIPPING = 25.9;

  let discount = 0;
  let freeShipping = false;

  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') discount = subtotal * (appliedCoupon.value / 100);
    if (appliedCoupon.type === 'fixed') discount = appliedCoupon.value;
    if (appliedCoupon.type === 'shipping') freeShipping = true;
  }

  const shipping = freeShipping ? 0 : SHIPPING;
  const total = subtotal - discount + shipping;

  const PIX_KEY = '38.240.088/0001-91';
  const PIX_FAKE_CODE = `00020126580014br.gov.bcb.pix0136${PIX_KEY}5204000053039865802BR5925Sweet Headshop LTDA6009Sao Paulo62070503***6304ABCD`;

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const coupon = VALID_COUPONS[code];
    if (coupon) {
      setAppliedCoupon({ ...coupon, code });
      setCouponSuccess(`✓ Cupom aplicado: ${coupon.label}`);
      setCouponError('');
    } else {
      setCouponError('Cupom inválido ou expirado.');
      setCouponSuccess('');
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponSuccess('');
    setCouponError('');
  }

  function copyPix() {
    navigator.clipboard.writeText(PIX_FAKE_CODE).catch(() => {});
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  }

  function placeOrder(e) {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setOrderPlaced(true);
      clearCart();
    }, 1800);
  }

  if (orderPlaced) {
    return (
      <div className="checkout-success">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Pedido recebido!</h2>
          <p>Seu pagamento PIX está sendo confirmado.<br />Você receberá uma confirmação em breve.</p>
          <div className="success-order">
            <span>Pedido #SH{Math.floor(Math.random() * 90000) + 10000}</span>
          </div>
          <Link to="/" className="btn-gold btn-large" style={{ display: 'inline-block', marginTop: 20 }}>
            Voltar à loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-topbar">
        <Link to="/" className="checkout-back">
          ← Sweet Headshop
        </Link>
        <div className="checkout-steps">
          <span className="step active">Dados</span>
          <span className="step-sep">›</span>
          <span className="step active">Pagamento</span>
          <span className="step-sep">›</span>
          <span className="step">Confirmação</span>
        </div>
      </div>

      <form className="checkout-body" onSubmit={placeOrder}>
        <div className="checkout-left">

          {/* Criar Conta */}
          <section className="co-section">
            <div className="co-section-header">
              <h3>Identificação</h3>
            </div>

            <label className="create-account-toggle">
              <input
                type="checkbox"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
              />
              <span>Criar conta para acompanhar meus pedidos</span>
            </label>

            <div className={`account-fields${createAccount ? ' visible' : ''}`}>
              <div className="field-row">
                <div className="field-group">
                  <label>Nome completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required={createAccount}
                  />
                </div>
                <div className="field-group">
                  <label>WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required={createAccount}
                  />
                </div>
                <div className="field-group">
                  <label>Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required={createAccount}
                  />
                </div>
              </div>
            </div>

            {!createAccount && (
              <div className="field-group" style={{ marginTop: 14 }}>
                <label>WhatsApp para entrega</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            )}
          </section>

          {/* Endereço de Entrega */}
          <section className="co-section">
            <div className="co-section-header">
              <h3>Endereço de Entrega</h3>
              <span className="co-badge">🚚 Delivery</span>
            </div>

            <div className="field-row">
              <div className="field-group" style={{ flex: 2 }}>
                <label>Rua / Avenida</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nome da rua"
                  required
                />
              </div>
              <div className="field-group" style={{ flex: 1 }}>
                <label>Número</label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="123"
                  required
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field-group">
                <label>Complemento</label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto, bloco... (opcional)"
                />
              </div>
              <div className="field-group">
                <label>Bairro</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Seu bairro"
                  required
                />
              </div>
            </div>

            <div className="field-group" style={{ maxWidth: 180 }}>
              <label>CEP</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                required
              />
            </div>

            <div className="delivery-note">
              📍 Entregamos em: Lapa · Perdizes · Vila Romana · Água Branca · V. Madalena
            </div>
          </section>

          {/* Cupom de Desconto */}
          <section className="co-section">
            <div className="co-section-header">
              <h3>Cupom de Desconto</h3>
            </div>

            {appliedCoupon ? (
              <div className="coupon-applied">
                <span className="coupon-tag">🏷️ {appliedCoupon.code}</span>
                <span className="coupon-desc">{appliedCoupon.label}</span>
                <button type="button" className="coupon-remove" onClick={removeCoupon}>Remover</button>
              </div>
            ) : (
              <div className="coupon-row">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Digite seu cupom"
                  className="coupon-input"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                />
                <button type="button" className="coupon-btn" onClick={applyCoupon}>
                  Aplicar
                </button>
              </div>
            )}
            {couponError && <p className="coupon-error">{couponError}</p>}
            {couponSuccess && <p className="coupon-success">{couponSuccess}</p>}
          </section>

          {/* Pagamento PIX */}
          <section className="co-section">
            <div className="co-section-header">
              <h3>Forma de Pagamento</h3>
            </div>

            <div className="payment-option active">
              <div className="payment-option-header">
                <div className="pix-logo">
                  <PixIcon />
                  <span>PIX</span>
                </div>
                <span className="pix-instant">Pagamento instantâneo</span>
              </div>

              <div className="pix-instructions">
                <div className="pix-step">
                  <span className="pix-num">1</span>
                  <span>Finalize o pedido clicando no botão abaixo</span>
                </div>
                <div className="pix-step">
                  <span className="pix-num">2</span>
                  <span>Copie a chave PIX ou use o QR Code</span>
                </div>
                <div className="pix-step">
                  <span className="pix-num">3</span>
                  <span>Pague pelo app do seu banco e confirme</span>
                </div>
              </div>

              <div className="pix-key-box">
                <div className="pix-key-label">Chave PIX (CNPJ)</div>
                <div className="pix-key-value">
                  <code>{PIX_KEY}</code>
                  <button type="button" className="pix-copy" onClick={copyPix}>
                    {pixCopied ? '✓ Copiado!' : 'Copiar chave'}
                  </button>
                </div>
              </div>

              <p className="pix-notice">
                ⚡ O pedido é confirmado assim que o pagamento é identificado (geralmente em segundos).
              </p>
            </div>
          </section>
        </div>

        {/* Resumo do Pedido */}
        <div className="checkout-right">
          <div className="order-summary">
            <h3>Resumo do Pedido</h3>

            <div className="order-items">
              {items.length === 0 ? (
                <p className="empty-cart-msg">Carrinho vazio. <Link to="/">Adicionar itens →</Link></p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="order-item">
                    <span className="oi-icon">{item.icon}</span>
                    <div className="oi-info">
                      <span className="oi-name">{item.name}</span>
                      <span className="oi-qty">× {item.qty}</span>
                    </div>
                    <span className="oi-price">{fmt(item.price * item.qty)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="order-totals">
              <div className="ot-line">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="ot-line ot-discount">
                  <span>Desconto ({appliedCoupon?.code})</span>
                  <span>- {fmt(discount)}</span>
                </div>
              )}
              <div className="ot-line">
                <span>Entrega</span>
                <span className={freeShipping ? 'free-shipping' : ''}>
                  {freeShipping ? 'Grátis' : fmt(shipping)}
                </span>
              </div>
              <div className="ot-line ot-total">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
              <p className="pix-value-note">💰 Via PIX: {fmt(total)}</p>
            </div>

            <button
              type="submit"
              className="btn-checkout-final"
              disabled={items.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <span className="processing">⏳ Processando...</span>
              ) : (
                <>
                  <PixIcon /> Confirmar e Pagar via PIX
                </>
              )}
            </button>

            <p className="checkout-security">
              🔒 Ambiente seguro · Dados protegidos
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}