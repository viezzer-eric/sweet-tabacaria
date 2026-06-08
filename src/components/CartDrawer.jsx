import { X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { PRODUCT_ICONS } from '../data/products';

function fmt(n) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export default function CartDrawer({ isOpen, onClose }) {
  const { items, removeItem, updateQty, subtotal, totalCount } = useCart();
  const shipping = items.length > 0 ? 25.9 : 0;
  const total = subtotal + shipping;

  return (
    <>
      <div
        className={`cart-ov${isOpen ? ' on' : ''}`}
        id="cartOv"
        onClick={onClose}
      />
      <aside className={`cart-drawer${isOpen ? ' on' : ''}`} id="cartDrawer">
        <div className="cdh">
          <h3>Seu Carrinho</h3>
          <button className="cdc" onClick={onClose} aria-label="Fechar carrinho">
            <X size={18} />
          </button>
        </div>

        <div className="cditems" style={{ padding: items.length ? '16px 20px' : undefined }}>
          {items.length === 0 ? (
            <p>Carrinho vazio. Adicione itens para começar!</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="ci-icon">{(() => { const Ic = PRODUCT_ICONS[item.icon]; return Ic ? <Ic size={24} aria-hidden="true" /> : null; })()}</div>
                <div className="ci-info">
                  <p className="ci-name">{item.name}</p>
                  <p className="ci-price">{fmt(item.price)}</p>
                </div>
                <div className="ci-qty">
                  <button onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                </div>
                <button className="ci-remove" onClick={() => removeItem(item.id)}>
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-totals">
              <div className="ct-line">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="ct-line">
                <span>Entrega</span>
                <span>{fmt(shipping)}</span>
              </div>
              <div className="ct-line ct-total">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-checkout" onClick={onClose}>
              Finalizar Pedido
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
