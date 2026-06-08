import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MOCK_ORDER_HISTORY = [
  { id: 'SH47810', date: '2026-05-30', items: ['Kit Iniciante Premium × 1', 'Seda King Size × 2'], total: 73.90, status: 'delivered' },
  { id: 'SH47795', date: '2026-05-18', items: ['Kit Heavy Grind × 1'], total: 80.90, status: 'delivered' },
  { id: 'SH47771', date: '2026-04-22', items: ['Triturador Policarbonato × 1'], total: 60.90, status: 'delivered' },
  { id: 'SH47749', date: '2026-03-14', items: ['Kit Degustação Double Glass × 1', 'Isqueiro × 1'], total: 71.90, status: 'delivered' },
];

const STATUS_LABEL = {
  delivered: { label: 'Entregue', color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
  out: { label: 'Em rota', color: '#a68bff', bg: 'rgba(166,139,255,.12)' },
  preparing: { label: 'Preparando', color: '#63a0e0', bg: 'rgba(99,160,224,.12)' },
  pending: { label: 'Aguardando', color: '#e8be6a', bg: 'rgba(232,190,106,.12)' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
};

function fmt(n) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

function Avatar({ name, size = 48 }) {
  const initials = name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div
      className="user-avatar"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

export default function UserProfile() {
  const { currentUser, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState('');

  // Profile fields
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  // Address fields
  const [street, setStreet] = useState(currentUser?.address?.street || '');
  const [number, setNumber] = useState(currentUser?.address?.number || '');
  const [complement, setComplement] = useState(currentUser?.address?.complement || '');
  const [neighborhood, setNeighborhood] = useState(currentUser?.address?.neighborhood || '');
  const [cep, setCep] = useState(currentUser?.address?.cep || '');

  // Password
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  function saveProfile(e) {
    e.preventDefault();
    updateProfile({ name, email, phone });
    showSaved('Perfil atualizado!');
  }

  function saveAddress(e) {
    e.preventDefault();
    updateProfile({ address: { street, number, complement, neighborhood, cep } });
    showSaved('Endereço salvo!');
  }

  function savePassword(e) {
    e.preventDefault();
    setPassError('');
    if (currentPass !== currentUser.password) {
      setPassError('Senha atual incorreta.');
      return;
    }
    if (newPass.length < 6) {
      setPassError('Nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('As senhas não conferem.');
      return;
    }
    updateProfile({ password: newPass });
    setCurrentPass(''); setNewPass(''); setConfirmPass('');
    showSaved('Senha alterada com sucesso!');
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
    { id: 'profile', icon: '👤', label: 'Meu Perfil' },
    { id: 'address', icon: '📍', label: 'Endereço' },
    { id: 'password', icon: '🔒', label: 'Senha' },
    { id: 'orders', icon: '📦', label: 'Pedidos' },
  ];

  return (
    <div className="profile-page">
      {/* Top bar */}
      <header className="profile-header">
        <Link to="/" className="profile-brand">← Sweet Headshop</Link>
        <span className="profile-header-title">Minha Conta</span>
        <button className="profile-logout-btn" onClick={handleLogout}>Sair</button>
      </header>

      <div className="profile-body">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-user-card">
            <Avatar name={currentUser.name} size={64} />
            <div className="puc-info">
              <span className="puc-name">{currentUser.name}</span>
              <span className="puc-email">{currentUser.email}</span>
              <span className="puc-badge">
                {currentUser.role === 'admin' ? '🛡 Admin' : '🛒 Cliente'}
              </span>
            </div>
          </div>

          <div className="profile-stats">
            <div className="pstat">
              <span className="pstat-v">{MOCK_ORDER_HISTORY.length}</span>
              <span className="pstat-l">Pedidos</span>
            </div>
            <div className="pstat">
              <span className="pstat-v pstat-gold">
                {fmt(MOCK_ORDER_HISTORY.reduce((s, o) => s + o.total, 0))}
              </span>
              <span className="pstat-l">Gasto total</span>
            </div>
          </div>

          <nav className="profile-nav">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`pnav-btn${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="pnav-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
            {currentUser.role === 'admin' && (
              <Link to="/admin" className="pnav-btn pnav-admin">
                <span className="pnav-icon">🔧</span>
                Painel Admin
              </Link>
            )}
          </nav>
        </aside>

        {/* Content */}
        <div className="profile-content">
          {saved && <div className="profile-saved">{saved}</div>}

          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="ps-head">
                <h2>Informações Pessoais</h2>
                <p>Atualize seu nome, e-mail e telefone de contato.</p>
              </div>
              <form onSubmit={saveProfile} className="profile-form">
                <div className="pf-group">
                  <label>Nome completo</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="pf-row">
                  <div className="pf-group">
                    <label>E-mail</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="pf-group">
                    <label>WhatsApp</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                </div>
                <div className="pf-footer">
                  <button type="submit" className="pf-save-btn">Salvar alterações</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="profile-section">
              <div className="ps-head">
                <h2>Endereço de Entrega</h2>
                <p>Seu endereço padrão para os pedidos de delivery.</p>
              </div>
              <form onSubmit={saveAddress} className="profile-form">
                <div className="pf-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
                  <div className="pf-group">
                    <label>Rua / Avenida</label>
                    <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Nome da rua" />
                  </div>
                  <div className="pf-group">
                    <label>Número</label>
                    <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="123" />
                  </div>
                </div>
                <div className="pf-row">
                  <div className="pf-group">
                    <label>Complemento</label>
                    <input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, bloco..." />
                  </div>
                  <div className="pf-group">
                    <label>Bairro</label>
                    <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Seu bairro" />
                  </div>
                </div>
                <div className="pf-group" style={{ maxWidth: 200 }}>
                  <label>CEP</label>
                  <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" />
                </div>
                <div className="delivery-area-note">
                  📍 Entregamos em: Lapa · Perdizes · Vila Romana · Água Branca · V. Madalena
                </div>
                <div className="pf-footer">
                  <button type="submit" className="pf-save-btn">Salvar endereço</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="profile-section">
              <div className="ps-head">
                <h2>Alterar Senha</h2>
                <p>Escolha uma senha forte com pelo menos 6 caracteres.</p>
              </div>
              <form onSubmit={savePassword} className="profile-form" style={{ maxWidth: 420 }}>
                <div className="pf-group">
                  <label>Senha atual</label>
                  <div className="pass-wrap">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      required
                    />
                    <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div className="pf-group">
                  <label>Nova senha</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
                <div className="pf-group">
                  <label>Confirmar nova senha</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                  />
                </div>
                {passError && <p className="login-error">{passError}</p>}
                <div className="pf-footer">
                  <button type="submit" className="pf-save-btn">Alterar senha</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="profile-section">
              <div className="ps-head">
                <h2>Histórico de Pedidos</h2>
                <p>Todos os seus pedidos anteriores.</p>
              </div>
              <div className="orders-history">
                {MOCK_ORDER_HISTORY.map((order) => {
                  const sc = STATUS_LABEL[order.status];
                  return (
                    <div key={order.id} className="oh-row">
                      <div className="oh-left">
                        <span className="oh-id">#{order.id}</span>
                        <span className="oh-date">{order.date}</span>
                        <div className="oh-items">
                          {order.items.map((item, i) => (
                            <span key={i}>{item}</span>
                          ))}
                        </div>
                      </div>
                      <div className="oh-right">
                        <span className="oh-total">{fmt(order.total)}</span>
                        <span
                          className="oh-status"
                          style={{ color: sc.color, background: sc.bg }}
                        >
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}