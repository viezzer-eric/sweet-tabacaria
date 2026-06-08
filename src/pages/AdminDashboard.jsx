import { useState } from 'react';
import { Link } from 'react-router-dom';

const MOCK_ORDERS = [
  { id: 'SH47821', customer: 'Lucas Ferreira', phone: '(11) 98765-4321', address: 'R. das Flores, 42 - Perdizes', items: ['Kit Iniciante Premium × 1', 'Seda King Size × 2'], total: 73.90, status: 'pending', created: '2026-06-08 09:12', payment: 'pix', paid: true },
  { id: 'SH47820', customer: 'Ana Souza', phone: '(11) 91234-5678', address: 'Av. Pompeia, 255 - Lapa', items: ['Kit Heavy Grind × 1'], total: 80.90, status: 'preparing', created: '2026-06-08 08:55', payment: 'pix', paid: true },
  { id: 'SH47819', customer: 'Rafael Costa', phone: '(11) 97654-3210', address: 'R. Crasso, 12 - V. Romana', items: ['Triturador Policarbonato × 1', 'Isqueiro Premium × 2'], total: 64.80, status: 'out', created: '2026-06-08 08:30', payment: 'pix', paid: true },
  { id: 'SH47818', customer: 'Marina Lima', phone: '(11) 95555-0001', address: 'R. Cardoso de Almeida, 88 - Perdizes', items: ['Kit Degustação Double Glass × 2'], total: 89.80, status: 'delivered', created: '2026-06-07 17:45', payment: 'pix', paid: true },
  { id: 'SH47817', customer: 'Pedro Alves', phone: '(11) 94444-7777', address: 'R. Turiassu, 310 - V. Pompeia', items: ['Seda de Vidro Borossilicato × 3', 'Cuia de Silicone × 1'], total: 76.00, status: 'delivered', created: '2026-06-07 16:20', payment: 'pix', paid: true },
  { id: 'SH47816', customer: 'Camila Rocha', phone: '(11) 93333-2222', address: 'Av. Sumaré, 120 - V. Madalena', items: ['Kit Iniciante Premium × 1'], total: 75.80, status: 'cancelled', created: '2026-06-07 14:10', payment: 'pix', paid: false },
  { id: 'SH47815', customer: 'Bruno Melo', phone: '(11) 92222-9999', address: 'R. Pio XI, 47 - Alto da Lapa', items: ['Isqueiro Recarregável × 4'], total: 65.50, status: 'pending', created: '2026-06-08 10:05', payment: 'pix', paid: false },
];

const STATUS_CONFIG = {
  pending:   { label: 'Aguardando',  color: '#e8be6a', bg: 'rgba(232,190,106,.15)', icon: '⏳' },
  preparing: { label: 'Preparando',  color: '#63a0e0', bg: 'rgba(99,160,224,.15)', icon: '📦' },
  out:       { label: 'Saiu p/ entrega', color: '#a68bff', bg: 'rgba(166,139,255,.15)', icon: '🛵' },
  delivered: { label: 'Entregue',    color: '#22c55e', bg: 'rgba(34,197,94,.15)', icon: '✅' },
  cancelled: { label: 'Cancelado',   color: '#ef4444', bg: 'rgba(239,68,68,.15)', icon: '✕' },
};

function fmt(n) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const NEXT_STATUS = {
    pending: 'preparing',
    preparing: 'out',
    out: 'delivered',
  };

  function advanceStatus(id) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id && NEXT_STATUS[o.status]
          ? { ...o, status: NEXT_STATUS[o.status] }
          : o
      )
    );
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => ({
        ...prev,
        status: NEXT_STATUS[prev.status] || prev.status,
      }));
    }
  }

  function cancelOrder(id) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'cancelled' } : o))
    );
    setSelectedOrder(null);
  }

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.address.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    out: orders.filter((o) => o.status === 'out').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const todayRevenue = orders.filter((o) => o.paid && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  return (
    <div className="admin-page">
      {/* Top Bar */}
      <header className="admin-header">
        <div className="admin-hdr-inner">
          <div className="admin-brand">
            <span className="admin-logo">Sweet Headshop</span>
            <span className="admin-role">Painel Admin</span>
          </div>
          <div className="admin-hdr-r">
            <Link to="/" className="admin-back-btn">← Ver loja</Link>
          </div>
        </div>
      </header>

      <div className="admin-body">
        {/* Métricas */}
        <div className="admin-metrics">
          <div className="metric-card">
            <span className="metric-label">Pedidos hoje</span>
            <span className="metric-value">{orders.filter(o => o.created.startsWith('2026-06-08')).length}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Receita confirmada</span>
            <span className="metric-value metric-gold">{fmt(todayRevenue)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Em rota agora</span>
            <span className="metric-value metric-purple">{counts.out}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Aguardando preparo</span>
            <span className="metric-value metric-amber">{counts.pending}</span>
          </div>
        </div>

        <div className="admin-main">
          {/* Lista de pedidos */}
          <div className="orders-panel">
            <div className="orders-panel-top">
              <div className="orders-search-box">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Buscar pedido, cliente…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="status-filters">
                {['all', 'pending', 'preparing', 'out', 'delivered', 'cancelled'].map((s) => (
                  <button
                    key={s}
                    className={`sf-btn${filterStatus === s ? ' active' : ''}`}
                    onClick={() => setFilterStatus(s)}
                  >
                    {s === 'all' ? 'Todos' : STATUS_CONFIG[s].icon + ' ' + STATUS_CONFIG[s].label}
                    <span className="sf-count">{counts[s]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="orders-list">
              {filtered.length === 0 ? (
                <div className="orders-empty">
                  <span>📦</span>
                  <p>Nenhum pedido encontrado</p>
                </div>
              ) : (
                filtered.map((order) => {
                  const sc = STATUS_CONFIG[order.status];
                  return (
                    <div
                      key={order.id}
                      className={`order-row${selectedOrder?.id === order.id ? ' selected' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="or-top">
                        <span className="or-id">#{order.id}</span>
                        <span
                          className="or-status"
                          style={{ color: sc.color, background: sc.bg }}
                        >
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                      <div className="or-customer">{order.customer}</div>
                      <div className="or-address">{order.address}</div>
                      <div className="or-bottom">
                        <span className="or-time">{order.created.split(' ')[1]}</span>
                        <span className="or-total">{fmt(order.total)}</span>
                        {order.paid ? (
                          <span className="or-paid">PIX ✓</span>
                        ) : (
                          <span className="or-unpaid">Aguard. PIX</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detalhe do pedido */}
          <div className="order-detail">
            {selectedOrder ? (
              <>
                <div className="od-header">
                  <div>
                    <h3>Pedido #{selectedOrder.id}</h3>
                    <span className="od-time">{selectedOrder.created}</span>
                  </div>
                  <button className="od-close" onClick={() => setSelectedOrder(null)}>✕</button>
                </div>

                <div className="od-body">
                  {/* Status */}
                  <div className="od-status-track">
                    {['pending', 'preparing', 'out', 'delivered'].map((s, i) => {
                      const sc2 = STATUS_CONFIG[s];
                      const steps = ['pending', 'preparing', 'out', 'delivered'];
                      const currentIdx = steps.indexOf(selectedOrder.status);
                      const isActive = i <= currentIdx;
                      const isCancelled = selectedOrder.status === 'cancelled';
                      return (
                        <div key={s} className={`track-step${isActive && !isCancelled ? ' done' : ''}${selectedOrder.status === s ? ' current' : ''}`}>
                          <div className="track-dot">{isActive && !isCancelled ? '✓' : sc2.icon}</div>
                          <span>{sc2.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {selectedOrder.status === 'cancelled' && (
                    <div className="od-cancelled-badge">✕ Pedido Cancelado</div>
                  )}

                  {/* Cliente */}
                  <div className="od-section">
                    <h4>Cliente</h4>
                    <div className="od-info-grid">
                      <div className="od-info-item">
                        <span className="od-info-label">Nome</span>
                        <span>{selectedOrder.customer}</span>
                      </div>
                      <div className="od-info-item">
                        <span className="od-info-label">WhatsApp</span>
                        <a
                          href={`https://wa.me/55${selectedOrder.phone.replace(/\D/g,'')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="od-wpp-link"
                        >
                          💬 {selectedOrder.phone}
                        </a>
                      </div>
                      <div className="od-info-item" style={{ gridColumn: '1/-1' }}>
                        <span className="od-info-label">Endereço</span>
                        <span>{selectedOrder.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Itens */}
                  <div className="od-section">
                    <h4>Itens do Pedido</h4>
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="od-item">{item}</div>
                    ))}
                    <div className="od-item-total">
                      Total: <strong>{fmt(selectedOrder.total)}</strong>
                      {selectedOrder.paid && <span className="od-paid-tag">PIX confirmado ✓</span>}
                    </div>
                  </div>

                  {/* Ações */}
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <div className="od-actions">
                      <button
                        className="btn-advance"
                        onClick={() => advanceStatus(selectedOrder.id)}
                      >
                        {selectedOrder.status === 'pending' && '📦 Iniciar Preparo'}
                        {selectedOrder.status === 'preparing' && '🛵 Saiu para Entrega'}
                        {selectedOrder.status === 'out' && '✅ Confirmar Entrega'}
                      </button>
                      <button
                        className="btn-cancel-order"
                        onClick={() => cancelOrder(selectedOrder.id)}
                      >
                        Cancelar Pedido
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === 'delivered' && (
                    <div className="od-done-msg">✅ Entrega concluída com sucesso!</div>
                  )}
                </div>
              </>
            ) : (
              <div className="od-empty">
                <span>📋</span>
                <p>Selecione um pedido para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}