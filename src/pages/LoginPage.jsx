import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register, error, setError } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(m) {
    setMode(m);
    setLocalError('');
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setCpf('');
    setConfirmPassword('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLocalError('');
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate('/conta');
    } else {
      setLocalError('E-mail ou senha incorretos.');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLocalError('');
    if (password !== confirmPassword) {
      setLocalError('As senhas não conferem.');
      return;
    }
    if (password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setLocalError('CPF inválido. Digite os 11 dígitos.');
      return;
    }
    setSubmitting(true);
    const result = await register({ name, email, password, phone, cpf: cleanCpf });
    setSubmitting(false);
    if (result.success) {
      navigate('/conta');
    } else {
      setLocalError(result.error || 'Erro ao criar conta.');
    }
  }

  const displayError = localError || error;

  return (
    <div className="login-page">
      <div className="login-bg-deco" aria-hidden="true">
        <div className="deco-ring r1" />
        <div className="deco-ring r2" />
        <div className="deco-ring r3" />
      </div>

      <Link to="/" className="login-brand">
        <span className="login-brand-name">Capivara Smoke</span>
        <span className="login-brand-tag">Delivery · Lapa · SP</span>
      </Link>

      <div className="login-card">
        <div className="login-tabs">
          <button
            className={`login-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button
            className={`login-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Criar Conta
          </button>
          <div className={`login-tab-indicator${mode === 'register' ? ' right' : ''}`} />
        </div>

        {mode === 'login' ? (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="lf-group">
              <label>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="lf-group">
              <label>Senha</label>
              <div className="pass-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label="Mostrar/ocultar senha"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {displayError && <p className="login-error">{displayError}</p>}

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? <span className="processing"><Loader size={18} className="spin" aria-hidden="true" /> Entrando...</span> : 'Entrar na conta'}
            </button>

            <div className="login-hint">
              <p>Usuário: <code>lucas@email.com</code> / <code>123456</code></p>
            </div>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegister}>
            <div className="lf-group">
              <label>Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>

            <div className="lf-row">
              <div className="lf-group">
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="lf-group">
                <label>WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="lf-group">
              <label>CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                  let formatted = raw;
                  if (raw.length > 3) formatted = raw.slice(0, 3) + '.' + raw.slice(3);
                  if (raw.length > 6) formatted = formatted.slice(0, 7) + '.' + formatted.slice(7);
                  if (raw.length > 9) formatted = formatted.slice(0, 11) + '-' + formatted.slice(11);
                  setCpf(formatted);
                }}
                placeholder="000.000.000-00"
                required
                inputMode="numeric"
              />
            </div>

            <div className="lf-row">
              <div className="lf-group">
                <label>Senha</label>
                <div className="pass-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    className="pass-toggle"
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="lf-group">
                <label>Confirmar senha</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                />
              </div>
            </div>

            {displayError && <p className="login-error">{displayError}</p>}

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? <span className="processing"><Loader size={18} className="spin" aria-hidden="true" /> Criando...</span> : 'Criar minha conta'}
            </button>
          </form>
        )}

        <Link to="/" className="login-skip">
          <ArrowLeft size={14} aria-hidden="true" /> Continuar sem fazer login
        </Link>
      </div>
    </div>
  );
}