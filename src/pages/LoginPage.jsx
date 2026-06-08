import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register, error, setError } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPass, setShowPass] = useState(false);

  function switchMode(m) {
    setMode(m);
    setLocalError('');
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setConfirmPassword('');
  }

  function handleLogin(e) {
    e.preventDefault();
    setLocalError('');
    const result = login(email, password);
    if (result.success) {
      if (result.role === 'admin') navigate('/admin');
      else navigate('/conta');
    } else {
      setLocalError('E-mail ou senha incorretos.');
    }
  }

  function handleRegister(e) {
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
    const result = register({ name, email, password, phone });
    if (result.success) {
      navigate('/conta');
    } else {
      setLocalError(result.error);
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
        <span className="login-brand-name">Sweet Headshop</span>
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
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {displayError && <p className="login-error">{displayError}</p>}

            <button type="submit" className="login-submit">
              Entrar na conta
            </button>

            <div className="login-hint">
              <p>Teste: <code>admin@sweaheadshop.com</code> / <code>admin123</code></p>
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
                    {showPass ? '🙈' : '👁'}
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

            <button type="submit" className="login-submit">
              Criar minha conta
            </button>
          </form>
        )}

        <Link to="/" className="login-skip">
          ← Continuar sem fazer login
        </Link>
      </div>
    </div>
  );
}