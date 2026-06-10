import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Tag, Zap, Lock, Check, Loader, ArrowLeft, ArrowRight, Truck, DollarSign, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PRODUCT_ICONS } from '../data/products';
import AddressModal from '../components/AddressModal';
import * as client from '../api/client';

const VALID_COUPONS = {
  'CAPIVARA10': { type: 'percent', value: 10, label: '10% de desconto' },
  'BEMVINDO': { type: 'fixed', value: 15, label: 'R$ 15,00 de desconto' },
  'FRETE0': { type: 'shipping', value: 0, label: 'Frete grátis' },
};

function fmt(n) { return `R$ ${n.toFixed(2).replace('.', ',')}`; }

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
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [pixCopied, setPixCopied] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
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

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const coupon = VALID_COUPONS[code];
    if (coupon) {
      setAppliedCoupon({ ...coupon, code });
      setCouponSuccess(`Cupom aplicado: ${coupon.label}`);
      setCouponError('');
      showToast(`Cupom ${code} aplicado! ${coupon.label}`, 'success');
    } else {
      setCouponError('Cupom inválido ou expirado.');
      setCouponSuccess('');
      showToast('Cupom inválido ou expirado', 'error');
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponSuccess('');
    setCouponError('');
  }

  function copyPix() {
    if (orderResult?.pixCopyPaste) {
      navigator.clipboard.writeText(orderResult.pixCopyPaste).catch(() => {});
      setPixCopied(true);
      showToast('Código PIX copiado!', 'success');
      setTimeout(() => setPixCopied(false), 3000);
    }
  }

  function handleAddressSelect(addr) {
    setSelectedAddress(addr);
  }

  async function placeOrder(e) {
    e.preventDefault();
    if (!currentUser) { navigate('/login'); return; }
    if (!selectedAddress) { showToast('Selecione um endereço de entrega', 'error'); return; }

    setIsProcessing(true);
    try {
      const orderItems = items.map((i) => ({ productId: i.id, quantity: i.qty }));
      const result = await client.createOrder({
        addressId: selectedAddress.id,
        items: orderItems,
        couponCode: appliedCoupon?.code || null,
      });
      setOrderResult(result);
      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      showToast(err.message || 'Erro ao criar pedido', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  if (orderPlaced) {
    return (
      <div className="checkout-success">
        <div className="success-card">
          <CheckCircle size={48} className="success-icon" aria-hidden="true" />
          <h2>Pedido recebido!</h2>
          <p>Seu pagamento PIX está sendo confirmado.<br />Você receberá uma confirmação em breve.</p>
          <div className="success-order">
            <span>Pedido #{orderResult?.id?.slice(0, 8).toUpperCase()}</span>
          </div>
          {orderResult?.pixCopyPaste && (
            <div className="pix-key-box" style={{ marginTop: 16 }}>
              <div className="pix-key-label">Código PIX</div>
              <div className="pix-key-value">
                <code style={{ fontSize: 11 }}>{orderResult.pixCopyPaste.slice(0, 40)}...</code>
                <button type="button" className="pix-copy" onClick={copyPix}>
                  {pixCopied ? <><Check size={14} aria-hidden="true" /> Copiado!</> : 'Copiar'}
                </button>
              </div>
            </div>
          )}
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
        <Link to="/" className="checkout-back"><ArrowLeft size={16} aria-hidden="true" /> Capivara Smoke</Link>
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
          <section className="co-section">
            <div className="co-section-header">
              <h3>Identificação</h3>
            </div>
            {currentUser ? (
              <div className="checkout-logged-info" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 14, color: 'var(--text)' }}>
                <CheckCircle size={16} color="var(--gold)" aria-hidden="true" />
                <span>{currentUser.name} — {currentUser.email}</span>
              </div>
            ) : (
              <div className="checkout-login-invite" style={{ marginBottom: 14, fontSize: 13 }}>
                <Link to="/login">Faça login</Link> para finalizar o pedido mais rápido.
              </div>
            )}
            <div className="field-group">
              <label>WhatsApp para contato</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" required />
            </div>
          </section>

          <section className="co-section">
            <div className="co-section-header">
              <h3>Endereço de Entrega</h3>
              <span className="co-badge"><Truck size={14} aria-hidden="true" /> Delivery</span>
            </div>

            {selectedAddress ? (
              <div className="selected-address-card">
                <div className="sac-top">
                  <MapPin size={18} aria-hidden="true" />
                  <div className="sac-info">
                    <span className="sac-street">{selectedAddress.street}, {selectedAddress.number}</span>
                    <span className="sac-neighborhood">{selectedAddress.neighborhood} — {selectedAddress.city}/{selectedAddress.state}</span>
                    {selectedAddress.complement && <span className="sac-complement">{selectedAddress.complement}</span>}
                    <span className="sac-cep">{selectedAddress.cep}</span>
                  </div>
                </div>
                <button type="button" className="sac-change" onClick={() => setShowAddressModal(true)}>
                  Trocar endereço
                </button>
              </div>
            ) : (
              <button type="button" className="btn-select-address" onClick={() => setShowAddressModal(true)}>
                <Plus size={16} aria-hidden="true" /> Selecionar endereço de entrega
              </button>
            )}

            <div className="delivery-note" style={{ marginTop: 14 }}>
              <MapPin size={14} aria-hidden="true" /> Entregamos em: Lapa · Perdizes · Vila Romana · Água Branca · V. Madalena
            </div>
          </section>

          <section className="co-section">
            <div className="co-section-header">
              <h3>Cupom de Desconto</h3>
            </div>
            {appliedCoupon ? (
              <div className="coupon-applied">
                <span className="coupon-tag"><Tag size={14} aria-hidden="true" /> {appliedCoupon.code}</span>
                <span className="coupon-desc">{appliedCoupon.label}</span>
                <button type="button" className="coupon-remove" onClick={removeCoupon}>Remover</button>
              </div>
            ) : (
              <div className="coupon-row">
                <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Digite seu cupom" className="coupon-input"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())} />
                <button type="button" className="coupon-btn" onClick={applyCoupon}>Aplicar</button>
              </div>
            )}
            {couponError && <p className="coupon-error">{couponError}</p>}
            {couponSuccess && <p className="coupon-success"><Check size={14} aria-hidden="true" /> {couponSuccess}</p>}
          </section>

          <section className="co-section">
            <div className="co-section-header">
              <h3>Forma de Pagamento</h3>
            </div>
            <div className="payment-option active">
              <div className="payment-option-header">
                <div className="pix-logo"><PixIcon /><span>PIX</span></div>
                <span className="pix-instant">Pagamento instantâneo</span>
              </div>
              <div className="pix-instructions">
                <div className="pix-step"><span className="pix-num">1</span><span>Finalize o pedido clicando no botão abaixo</span></div>
                <div className="pix-step"><span className="pix-num">2</span><span>Copie o código PIX ou use o QR Code</span></div>
                <div className="pix-step"><span className="pix-num">3</span><span>Pague pelo app do seu banco e confirme</span></div>
              </div>
              <p className="pix-notice"><Zap size={14} aria-hidden="true" /> O pedido é confirmado assim que o pagamento é identificado (geralmente em segundos).</p>
            </div>
          </section>
        </div>

        <div className="checkout-right">
          <div className="order-summary">
            <h3>Resumo do Pedido</h3>
            <div className="order-items">
              {items.length === 0 ? (
                <p className="empty-cart-msg">Carrinho vazio. <Link to="/">Adicionar itens <ArrowRight size={12} aria-hidden="true" /></Link></p>
              ) : (
                items.map((item) => {
                  const OiIcon = PRODUCT_ICONS[item.icon];
                  return (
                    <div key={item.id} className="order-item">
                      <span className="oi-icon">{OiIcon ? <OiIcon size={20} aria-hidden="true" /> : null}</span>
                      <div className="oi-info">
                        <span className="oi-name">{item.name}</span>
                        <span className="oi-qty">× {item.qty}</span>
                      </div>
                      <span className="oi-price">{fmt(item.price * item.qty)}</span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="order-totals">
              <div className="ot-line"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              {discount > 0 && <div className="ot-line ot-discount"><span>Desconto ({appliedCoupon?.code})</span><span>- {fmt(discount)}</span></div>}
              <div className="ot-line"><span>Entrega</span><span className={freeShipping ? 'free-shipping' : ''}>{freeShipping ? 'Grátis' : fmt(shipping)}</span></div>
              <div className="ot-line ot-total"><span>Total</span><span>{fmt(total)}</span></div>
              <p className="pix-value-note"><DollarSign size={14} aria-hidden="true" /> Via PIX: {fmt(total)}</p>
            </div>
            <button type="submit" className="btn-checkout-final" disabled={items.length === 0 || isProcessing || !currentUser || !selectedAddress}>
              {isProcessing ? (
                <span className="processing"><Loader size={18} className="spin" aria-hidden="true" /> Processando...</span>
              ) : (
                <><PixIcon /> Confirmar e Pagar via PIX</>
              )}
            </button>
            <p className="checkout-security"><Lock size={14} aria-hidden="true" /> Ambiente seguro · Dados protegidos</p>
          </div>
        </div>
      </form>

      <AddressModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSelect={handleAddressSelect}
        selectedId={selectedAddress?.id}
      />
    </div>
  );
}
