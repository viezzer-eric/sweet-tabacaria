import { useCart } from '../context/CartContext';

function fmt(n) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  return (
    <article className="pcard">
      <div className="pimg">
        {product.badge && (
          <span className={`bdg ${product.badge}`}>{product.badge}</span>
        )}
        <span>{product.icon}</span>
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
        <button className="padd" onClick={() => addItem(product)}>
          🛒 Adicionar
        </button>
      </div>
    </article>
  );
}
