import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { PRODUCT_ICONS } from '../data/products';

function fmt(n) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const IconComp = PRODUCT_ICONS[product.icon] || null;

  function handleAdd() {
    addItem(product);
    showToast(`${product.name} adicionado ao carrinho`);
  }

  return (
    <article className="pcard">
      <div className="pimg">
        {product.badge && (
          <span className={`bdg ${product.badge}`}>{product.badge}</span>
        )}
        {IconComp && <IconComp size={44} aria-hidden="true" />}
      </div>
      <div className="pinfo">
        <span className="pcat">{product.category}</span>
        <h3 className="pname">{product.name}</h3>
        <div className="pprice">
          <span className="pcurr">{fmt(product.price)}</span>
          {product.oldPrice && (
            <span className="pold">{fmt(product.oldPrice)}</span>
          )}
        </div>
        <button className="padd" onClick={handleAdd}>
          <ShoppingCart size={16} aria-hidden="true" />
          Adicionar
        </button>
      </div>
    </article>
  );
}
