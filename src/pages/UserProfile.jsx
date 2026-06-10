import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, MapPin, Lock, Package, Store, ShoppingBag, Wrench, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as client from '../api/client';

const STATUS_LABEL = {
  Delivered: { label: 'Entregue', color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
  Out: { label: 'Em rota', color: '#a68bff', bg: 'rgba(166,139,255,.12)' },
  Preparing: { label: 'Preparando', color: '#63a0e0', bg: 'rgba(99,160,224,.12)' },
  Pending: { label: 'Aguardando', color: '#e8be6a', bg: 'rgba(232,190,106,.12)' },
  Cancelled: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
};

function fmt(n) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

function Avatar({ name, size = 48 }) {
  const initials = name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div className="user-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export default function UserProfile() {
  const { currentUser, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      client.fetchAddresses().then(setAddresses).catch(() => {});
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && activeTab === 'orders') {
      setOrdersLoading(true);
      client.fetchOrders()
        .then(setOrders)
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [currentUser, activeTab]);

  if (loading) return null;

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  function showSaved(msg) {
    setSaved(msg);
    setTimeout(() => setSaved(''), 3000);
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const tabs = [
    { id: 'profile', icon: User, label: 'Meu Perfil' },
    { id: 'address', icon: MapPin, label: 'Endereço' },
    { id: 'orders', icon: Package, label: 'Pedidos' },
  ];

  return (
    <div className="profile-page">
      <header className="profile-header">
        <Link to="/" className="profile-brand">
          <ArrowLeft size={16} aria-hidden="true" /> Capivara Smoke
        </Link>
        <span className="profile-header-title">Minha Conta</span>
        <button className="profile-logout-btn" onClick={handleLogout}>Sair</button>
      </header>

      <div className="profile-body">
        <aside className="profile-sidebar">
          <div className="profile-user-card">
            <Avatar name={currentUser.name} size={64} />
            <div className="puc-info">
              <span className="puc-name">{currentUser.name}</span>
              <span className="puc-email">{currentUser.email}</span>
              <span className="puc-badge">
                {currentUser.role === 'fornecedor' ? (
                  <><Store size={14} aria-hidden="true" /> Fornecedor</>
                ) : (
                  <><ShoppingBag size={14} aria-hidden="true" /> Cliente</>
                )}
              </span>
            </div>
          </div>

          <div className="profile-stats">
            <div className="pstat">
              <span className="pstat-v">{orders.length}</span>
              <span className="pstat-l">Pedidos</span>
            </div>
            <div className="pstat">
              <span className="pstat-v pstat-gold">
                {fmt(orders.reduce((s, o) => s + o.total / 100, 0))}
              </span>
              <span className="pstat-l">Gasto total</span>
            </div>
          </div>

          <nav className="profile-nav">
            {tabs.map((t) => {
              const TabIcon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`pnav-btn${activeTab === t.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <TabIcon size={18} className="pnav-icon" aria-hidden="true" />
                  {t.label}
                </button>
              );
            })}
            {currentUser.role === 'fornecedor' && (
              <Link to="/admin" className="pnav-btn pnav-admin">
                <Wrench size={18} className="pnav-icon" aria-hidden="true" />
                Painel Fornecedor
              </Link>
            )}
          </nav>
        </aside>

        <div className="profile-content">
          {saved && <div className="profile-saved">{saved}</div>}

          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="ps-head">
                <h2>Informações Pessoais</h2>
                <p>Atualize seu nome, e-mail e telefone de contato.</p>
              </div>
              <div className="profile-form">
                <div className="pf-group">
                  <label>Nome completo</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="pf-row">
                  <div className="pf-group">
                    <label>E-mail</label>
                    <input type="email" value={email} disabled />
                  </div>
                  <div className="pf-group">
                    <label>WhatsApp</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                </div>
                <div className="pf-footer">
                  <button type="button" className="pf-save-btn" onClick={async () => {
                    try {
                      await client.updateProfile({ name, phone });
                      showSaved('Dados salvos com sucesso!');
                    } catch { showSaved('Erro ao salvar. Tente novamente.'); }
                  }}>Salvar alterações</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="profile-section">
              <div className="ps-head">
                <h2>Endereços de Entrega</h2>
                <p>Gerencie seus endereços salvos.</p>
              </div>
              {addresses.length === 0 ? (
                <p style={{ color: '#888', marginTop: 8 }}>Nenhum endereço salvo ainda.</p>
              ) : (
                <div className="orders-history">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="oh-row">
                      <div className="oh-left">
                        <span className="oh-id">{addr.street}, {addr.number}</span>
                        <span className="oh-date">{addr.neighborhood} — {addr.city}/{addr.state}</span>
                        {addr.complement && <div className="oh-items"><span>{addr.complement}</span></div>}
                      </div>
                      <div className="oh-right">
                        <span className="oh-total">{addr.cep}</span>
                        {addr.isDefault && (
                          <span className="oh-status" style={{ color: '#22c55e', background: 'rgba(34,197,55,.12)' }}>
                            Padrão
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="profile-section">
              <div className="ps-head">
                <h2>Histórico de Pedidos</h2>
                <p>Todos os seus pedidos anteriores.</p>
              </div>
              <div className="orders-history">
                {ordersLoading ? (
                  <p style={{ color: '#888' }}>Carregando...</p>
                ) : orders.length === 0 ? (
                  <p style={{ color: '#888' }}>Nenhum pedido ainda.</p>
                ) : (
                  orders.map((order) => {
                    const sc = STATUS_LABEL[order.status] || { label: order.status, color: '#888', bg: 'rgba(136,136,136,.12)' };
                    return (
                      <div key={order.id} className="oh-row">
                        <div className="oh-left">
                          <span className="oh-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className="oh-date">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                          <div className="oh-items">
                            {order.items?.map((item, i) => (
                              <span key={i}>{item.productName} × {item.quantity}</span>
                            ))}
                          </div>
                        </div>
                        <div className="oh-right">
                          <span className="oh-total">R$ {(order.total / 100).toFixed(2)}</span>
                          <span className="oh-status" style={{ color: sc.color, background: sc.bg }}>
                            {sc.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
