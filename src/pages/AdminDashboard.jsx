import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Package, Bike, CheckCircle, Clock, MessageCircle, ClipboardList, ArrowLeft, Check, ShoppingBag, Plus, Edit3, Trash2, Save, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as client from '../api/client';

const STATUS_ICONS = {
  pending: Clock,
  preparing: Package,
  out: Bike,
  delivered: CheckCircle,
  cancelled: X,
};

const STATUS_CONFIG = {
  pending:   { label: 'Aguardando',  color: '#e8be6a', bg: 'rgba(232,190,106,.15)' },
  preparing: { label: 'Preparando',  color: '#63a0e0', bg: 'rgba(99,160,224,.15)' },
  out:       { label: 'Saiu p/ entrega', color: '#a68bff', bg: 'rgba(166,139,255,.15)' },
  delivered: { label: 'Entregue',    color: '#22c55e', bg: 'rgba(34,197,94,.15)' },
  cancelled: { label: 'Cancelado',   color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
};

function fmt(n) { return `R$ ${n.toFixed(2).replace('.', ',')}`; }

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState('orders');

  // ── Orders ──
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const NEXT_STATUS = { pending: 'preparing', preparing: 'out', out: 'delivered' };

  useEffect(() => {
    if (tab === 'orders') {
      setOrdersLoading(true);
      Promise.all([
        client.fetchAdminOrders(),
        client.fetchAdminMetrics().catch(() => null)
      ])
        .then(([ordersData, metricsData]) => {
          setOrders(ordersData);
          setMetrics(metricsData);
        })
        .catch(() => showToast('Erro ao carregar pedidos', 'error'))
        .finally(() => setOrdersLoading(false));
    }
  }, [tab]);

  async function advanceStatus(id) {
    const statusKeys = ['pending', 'preparing', 'out', 'delivered'];
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const currentIdx = statusKeys.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= 3) return;
    const nextStatus = NEXT_STATUS[order.status];
    try {
      await client.updateOrderStatus(id, nextStatus);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: nextStatus } : o));
      setSelectedOrder((prev) => prev?.id === id ? { ...prev, status: nextStatus } : prev);
      showToast('Status atualizado!', 'success');
    } catch {
      showToast('Erro ao atualizar status', 'error');
    }
  }

  async function cancelOrder(id) {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    try {
      await client.cancelOrderByAdmin(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setSelectedOrder(null);
      showToast('Pedido cancelado', 'info');
    } catch {
      showToast('Erro ao cancelar pedido', 'error');
    }
  }

  const filteredOrders = orders.filter((o) => {
    const ms = filterStatus === 'all' || o.status.toLowerCase() === filterStatus;
    const q = searchQuery.toLowerCase();
    return ms && (!q || o.id?.toLowerCase().includes(q));
  });

  // ── Products ──
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    if (tab === 'products') {
      setProductsLoading(true);
      client.fetchAdminProducts()
        .then(setProducts)
        .catch(() => showToast('Erro ao carregar produtos', 'error'))
        .finally(() => setProductsLoading(false));
    }
  }, [tab]);

  const [productForm, setProductForm] = useState({
    name: '', slug: '', description: '', categoryId: 1,
    price: '', oldPrice: '', stock: '', badge: '', active: true, imageUrls: ''
  });

  function resetForm() {
    setProductForm({ name: '', slug: '', description: '', categoryId: 1, price: '', oldPrice: '', stock: '', badge: '', active: true, imageUrls: '' });
  }

  function slugify(text) { return text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, ''); }

  async function handleSaveProduct(e) {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const body = {
        categoryId: Number(productForm.categoryId),
        name: productForm.name,
        slug: productForm.slug || slugify(productForm.name),
        description: productForm.description || null,
        price: Math.round(Number(productForm.price) * 100),
        oldPrice: productForm.oldPrice ? Math.round(Number(productForm.oldPrice) * 100) : null,
        stock: Number(productForm.stock),
        badge: productForm.badge || null,
        active: productForm.active,
        imageUrls: productForm.imageUrls ? productForm.imageUrls.split('\n').map((s) => s.trim()).filter(Boolean) : null,
      };

      if (editingProduct) {
        await client.updateAdminProduct(editingProduct.id, body);
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? { ...p, ...body, price: body.price, oldPrice: body.oldPrice } : p));
        showToast('Produto atualizado!', 'success');
      } else {
        const result = await client.createAdminProduct(body);
        setProducts((prev) => [{ ...body, id: result.id, images: body.imageUrls?.map((url, i) => ({ url, isPrimary: i === 0 })) || [], category: 'Atualizar' }, ...prev]);
        showToast('Produto criado!', 'success');
      }
      setEditingProduct(null);
      setShowNewProduct(false);
      resetForm();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar', 'error');
    } finally {
      setSavingProduct(false);
    }
  }

  function startEdit(product) {
    setEditingProduct(product);
    setShowNewProduct(true);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      categoryId: product.categoryId || 1,
      price: (product.price / 100).toFixed(2),
      oldPrice: product.oldPrice ? (product.oldPrice / 100).toFixed(2) : '',
      stock: String(product.stock),
      badge: product.badge || '',
      active: product.active,
      imageUrls: product.images?.map((i) => i.url).join('\n') || '',
    });
  }

  async function handleDeleteProduct(id) {
    if (!confirm('Remover este produto?')) return;
    try {
      await client.deleteAdminProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Produto removido', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function renderStatusIcon(status, size = 14) {
    const Ic = STATUS_ICONS[status];
    return Ic ? <Ic size={size} aria-hidden="true" /> : null;
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-hdr-inner">
          <div className="admin-brand">
            <span className="admin-logo">Capivara Smoke</span>
            <span className="admin-role">Painel Admin</span>
          </div>
          <div className="admin-hdr-r">
            <nav className="admin-tabs">
              <button className={`atab${tab === 'orders' ? ' active' : ''}`} onClick={() => setTab('orders')}>
                <ClipboardList size={16} aria-hidden="true" /> Pedidos
              </button>
              <button className={`atab${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}>
                <ShoppingBag size={16} aria-hidden="true" /> Produtos
              </button>
            </nav>
            <Link to="/" className="admin-back-btn"><ArrowLeft size={14} aria-hidden="true" /> Loja</Link>
          </div>
        </div>
      </header>

      <div className="admin-body">
        {tab === 'orders' && (
          <>
            <div className="admin-metrics">
              <div className="metric-card">
                <span className="metric-label">Pedidos hoje</span>
                <span className="metric-value">{metrics?.todayOrders ?? orders.length}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Receita hoje</span>
                <span className="metric-value metric-gold">{metrics ? fmt(metrics.todayRevenue / 100) : '—'}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Pendentes</span>
                <span className="metric-value metric-amber">{metrics?.pending ?? 0}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Preparando</span>
                <span className="metric-value metric-purple">{metrics?.preparing ?? 0}</span>
              </div>
            </div>

            <div className="admin-main">
              <div className="orders-panel">
                <div className="orders-panel-top">
                  <div className="orders-search-box">
                    <Search size={16} aria-hidden="true" />
                    <input type="text" placeholder="Buscar pedido…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="status-filters">
                    {['all', 'pending', 'preparing', 'out', 'delivered', 'cancelled'].map((s) => {
                      const sc = STATUS_CONFIG[s];
                      return (
                        <button key={s} className={`sf-btn${filterStatus === s ? ' active' : ''}`} onClick={() => setFilterStatus(s)}>
                          {s !== 'all' && renderStatusIcon(s, 13)}
                          {s === 'all' ? 'Todos' : sc?.label || s}
                          <span className="sf-count">{orders.filter((o) => s === 'all' || o.status.toLowerCase() === s).length}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="orders-list">
                  {ordersLoading ? (
                    <div className="orders-empty"><Loader size={32} className="spin" /></div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="orders-empty"><Package size={40} aria-hidden="true" /><p>Nenhum pedido encontrado</p></div>
                  ) : (
                    filteredOrders.map((order) => {
                      const sc = STATUS_CONFIG[order.status.toLowerCase()] || STATUS_CONFIG.pending;
                      return (
                        <div key={order.id} className={`order-row${selectedOrder?.id === order.id ? ' selected' : ''}`} onClick={() => setSelectedOrder(order)}>
                          <div className="or-top">
                            <span className="or-id">#{order.id?.slice(0, 8).toUpperCase()}</span>
                            <span className="or-status" style={{ color: sc.color, background: sc.bg }}>
                              {renderStatusIcon(order.status.toLowerCase(), 13)} {sc.label}
                            </span>
                          </div>
                          <div className="or-bottom">
                            <span className="or-time">{new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="or-total">R$ {(order.total / 100).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="order-detail">
                {selectedOrder ? (
                  <>
                    <div className="od-header">
                      <div><h3>Pedido #{selectedOrder.id?.slice(0, 8).toUpperCase()}</h3><span className="od-time">{new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</span></div>
                      <button className="od-close" onClick={() => setSelectedOrder(null)}><X size={18} /></button>
                    </div>
                    <div className="od-body">
                      <div className="od-status-track">
                        {['pending', 'preparing', 'out', 'delivered'].map((s) => {
                          const sc2 = STATUS_CONFIG[s];
                          const steps = ['pending', 'preparing', 'out', 'delivered'];
                          const currentIdx = steps.indexOf(selectedOrder.status.toLowerCase());
                          const isActive = steps.indexOf(s) <= currentIdx;
                          return (
                            <div key={s} className={`track-step${isActive && selectedOrder.status !== 'Cancelled' ? ' done' : ''}${selectedOrder.status.toLowerCase() === s ? ' current' : ''}`}>
                              <div className="track-dot">{isActive && selectedOrder.status !== 'Cancelled' ? <Check size={14} /> : renderStatusIcon(s, 14)}</div>
                              <span>{sc2.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="od-section">
                        <h4>Itens</h4>
                        {selectedOrder.items?.map((item, i) => (
                          <div key={i} className="od-item">{item.productName} × {item.quantity} — R$ {(item.subtotal / 100).toFixed(2)}</div>
                        ))}
                        <div className="od-item-total">
                          Total: <strong>R$ {(selectedOrder.total / 100).toFixed(2)}</strong>
                          {selectedOrder.paidAt && <span className="od-paid-tag"><Check size={12} /> PIX</span>}
                        </div>
                      </div>
                      {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                        <div className="od-actions">
                          <button className="btn-advance" onClick={() => advanceStatus(selectedOrder.id)}>
                            <Package size={16} /> Avançar Status
                          </button>
                          <button className="btn-cancel-order" onClick={() => cancelOrder(selectedOrder.id)}>Cancelar</button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="od-empty"><ClipboardList size={40} /><p>Selecione um pedido</p></div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'products' && (
          <>
            <div className="admin-prod-top">
              <h2>Produtos ({products.length})</h2>
              <button className="admin-add-btn" onClick={() => { setShowNewProduct(true); setEditingProduct(null); resetForm(); }}>
                <Plus size={16} aria-hidden="true" /> Novo Produto
              </button>
            </div>

            {showNewProduct && (
              <form className="admin-prod-form" onSubmit={handleSaveProduct}>
                <div className="apf-header">
                  <h3>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                  <button type="button" className="apf-close" onClick={() => { setShowNewProduct(false); setEditingProduct(null); }}><X size={18} /></button>
                </div>
                <div className="apf-body">
                  <div className="apf-row">
                    <div className="apf-group" style={{ flex: 2 }}>
                      <label>Nome</label>
                      <input value={productForm.name} onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div className="apf-group" style={{ flex: 1 }}>
                      <label>Slug</label>
                      <input value={productForm.slug} onChange={(e) => setProductForm((f) => ({ ...f, slug: e.target.value }))} placeholder="gerado-auto" />
                    </div>
                  </div>
                  <div className="apf-group">
                    <label>Descrição</label>
                    <textarea value={productForm.description} onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
                  </div>
                  <div className="apf-row">
                    <div className="apf-group">
                      <label>Categoria ID</label>
                      <input type="number" value={productForm.categoryId} onChange={(e) => setProductForm((f) => ({ ...f, categoryId: e.target.value }))} />
                    </div>
                    <div className="apf-group">
                      <label>Preço (R$)</label>
                      <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))} required />
                    </div>
                    <div className="apf-group">
                      <label>Preço antigo (R$)</label>
                      <input type="number" step="0.01" value={productForm.oldPrice} onChange={(e) => setProductForm((f) => ({ ...f, oldPrice: e.target.value }))} />
                    </div>
                    <div className="apf-group">
                      <label>Estoque</label>
                      <input type="number" value={productForm.stock} onChange={(e) => setProductForm((f) => ({ ...f, stock: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="apf-row">
                    <div className="apf-group">
                      <label>Badge</label>
                      <input value={productForm.badge} onChange={(e) => setProductForm((f) => ({ ...f, badge: e.target.value }))} placeholder="sale / new" />
                    </div>
                    <div className="apf-group" style={{ justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 22 }}>
                      <input type="checkbox" checked={productForm.active} onChange={(e) => setProductForm((f) => ({ ...f, active: e.target.checked }))} id="prod-active" />
                      <label htmlFor="prod-active" style={{ fontSize: 13, cursor: 'pointer' }}>Ativo</label>
                    </div>
                  </div>
                  <div className="apf-group">
                    <label>URLs das imagens (uma por linha)</label>
                    <textarea value={productForm.imageUrls} onChange={(e) => setProductForm((f) => ({ ...f, imageUrls: e.target.value }))} rows={3} placeholder="https://picsum.photos/seed/meu-produto/400/400" />
                  </div>
                </div>
                <div className="apf-footer">
                  <button type="submit" className="admin-save-btn" disabled={savingProduct}>
                    {savingProduct ? <Loader size={16} className="spin" /> : <Save size={16} aria-hidden="true" />}
                    {editingProduct ? ' Salvar alterações' : ' Criar produto'}
                  </button>
                </div>
              </form>
            )}

            <div className="admin-prod-grid">
              {productsLoading ? (
                <div className="admin-prod-empty"><Loader size={32} className="spin" /><p>Carregando...</p></div>
              ) : products.length === 0 ? (
                <div className="admin-prod-empty"><ShoppingBag size={40} aria-hidden="true" /><p>Nenhum produto cadastrado</p></div>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="admin-prod-card">
                    <div className="apc-img">
                      <img
                        src={p.images?.[0]?.url || 'https://via.placeholder.com/200'}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Sem+Foto'; }}
                      />
                      {p.badge && <span className="apc-badge">{p.badge === 'sale' ? 'Promo' : p.badge === 'new' ? 'Novo' : p.badge}</span>}
                    </div>
                    <div className="apc-info">
                      <span className="apc-name">{p.name}</span>
                      <span className="apc-cat">{p.category}</span>
                      <span className="apc-price">R$ {(p.price / 100).toFixed(2)}</span>
                      {p.oldPrice && <span className="apc-old">R$ {(p.oldPrice / 100).toFixed(2)}</span>}
                      <span className={`apc-stock${p.stock <= 5 ? ' low' : ''}`}>{p.stock} em estoque</span>
                    </div>
                    <div className="apc-actions">
                      <button className="apc-edit" onClick={() => startEdit(p)}><Edit3 size={15} /></button>
                      <button className="apc-del" onClick={() => handleDeleteProduct(p.id)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
