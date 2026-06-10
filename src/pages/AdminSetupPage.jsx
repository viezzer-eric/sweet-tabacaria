import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Mail, Lock, Phone, Eye, EyeOff, Loader, ArrowRight } from 'lucide-react';
import * as client from '../api/client';

export default function AdminSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    client.checkSetup()
      .then((data) => {
        if (!data.needsSetup) { navigate('/'); return; }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('As senhas não conferem.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) { setError('CPF inválido. Digite os 11 dígitos.'); return; }

    setSubmitting(true);
    try {
      await client.setupPlatform(name, email, password, phone, cleanCpf, storeName, storeSlug);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="setup-page">
        <div className="setup-card" style={{ textAlign: 'center', padding: 60 }}>
          <Loader size={32} className="spin" aria-hidden="true" />
          <p style={{ marginTop: 16, color: '#888' }}>Verificando...</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="setup-page">
        <div className="setup-card" style={{ textAlign: 'center', padding: 48 }}>
          <Store size={48} className="setup-icon" aria-hidden="true" />
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, color: 'var(--gold)', margin: '12px 0 6px' }}>Capivara Smoke</h1>
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Loja configurada! Você é o fornecedor principal.</p>
          <button className="setup-btn" onClick={() => navigate('/')} style={{ maxWidth: 280, margin: '0 auto' }}>
            Ir para a Loja <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="setup-hero">
          <Store size={48} className="setup-icon" aria-hidden="true" />
          <h1>Capivara Smoke</h1>
          <p className="setup-subtitle">Bem-vindo! Configure sua loja e conta de fornecedor.</p>
        </div>

        <form className="setup-form" onSubmit={handleRegister}>
          <div className="sf-group">
            <label><Store size={14} aria-hidden="true" /> Nome da loja</label>
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Minha Loja" required />
          </div>
          <div className="sf-group">
            <label>Slug da loja</label>
            <input value={storeSlug} onChange={(e) => setStoreSlug(e.target.value.replace(/[^a-z0-9-]/g, ''))} placeholder="minha-loja" required />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          <div className="sf-group">
            <label><User size={14} aria-hidden="true" /> Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" required />
          </div>
          <div className="sf-row">
            <div className="sf-group">
              <label><Mail size={14} aria-hidden="true" /> E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@email.com" required />
            </div>
            <div className="sf-group">
              <label><Phone size={14} aria-hidden="true" /> WhatsApp</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div className="sf-group">
            <label>CPF</label>
            <input type="text" value={cpf} onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
              let formatted = raw;
              if (raw.length > 3) formatted = raw.slice(0, 3) + '.' + raw.slice(3);
              if (raw.length > 6) formatted = formatted.slice(0, 7) + '.' + formatted.slice(7);
              if (raw.length > 9) formatted = formatted.slice(0, 11) + '-' + formatted.slice(11);
              setCpf(formatted);
            }} placeholder="000.000.000-00" required inputMode="numeric" />
          </div>
          <div className="sf-row">
            <div className="sf-group">
              <label><Lock size={14} aria-hidden="true" /> Senha</label>
              <div className="pass-wrap">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
                <button type="button" className="pass-toggle" onClick={() => setShowPass((v) => !v)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="sf-group">
              <label><Lock size={14} aria-hidden="true" /> Confirmar senha</label>
              <input type={showPass ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" required />
            </div>
          </div>
          {error && <p className="setup-error">{error}</p>}
          <button type="submit" className="setup-btn" disabled={submitting}>
            {submitting ? <><Loader size={18} className="spin" aria-hidden="true" /> Criando...</> : 'Configurar loja'}
          </button>
        </form>
      </div>
    </div>
  );
}
