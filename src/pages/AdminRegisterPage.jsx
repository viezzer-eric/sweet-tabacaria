import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, User, Mail, Lock, Phone, FileText, Eye, EyeOff, Loader, ArrowLeft } from 'lucide-react';
import * as client from '../api/client';

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function formatCpf(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 3) formatted = digits.slice(0, 3) + '.' + digits.slice(3);
    if (digits.length > 6) formatted = formatted.slice(0, 7) + '.' + formatted.slice(7);
    if (digits.length > 9) formatted = formatted.slice(0, 11) + '-' + formatted.slice(11);
    return formatted;
  }

  function formatCnpj(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 14);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + '.' + digits.slice(2);
    if (digits.length > 5) formatted = formatted.slice(0, 6) + '.' + formatted.slice(6);
    if (digits.length > 8) formatted = formatted.slice(0, 10) + '/' + formatted.slice(10);
    if (digits.length > 12) formatted = formatted.slice(0, 15) + '-' + formatted.slice(15);
    return formatted;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('As senhas não conferem.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) { setError('CPF inválido. Digite os 11 dígitos.'); return; }

    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) { setError('CNPJ inválido. Digite os 14 dígitos.'); return; }

    setSubmitting(true);
    try {
      await client.registerAdmin({
        name, email, password, phone: phone || null,
        cpf: cleanCpf, cnpj: cleanCnpj,
        storeName, storeSlug, storeDescription: storeDescription || null
      });
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Erro ao criar conta de vendedor');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <div className="setup-hero">
          <Store size={48} className="setup-icon" aria-hidden="true" />
          <h1>Criar Conta de Vendedor</h1>
          <p className="setup-subtitle">Cadastre sua tabacaria e comece a vender.</p>
        </div>

        <form className="setup-form" onSubmit={handleSubmit}>
          <h3 className="sf-section-title"><User size={16} aria-hidden="true" /> Dados Pessoais</h3>

          <div className="sf-group">
            <label>Nome completo</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
          </div>

          <div className="sf-row">
            <div className="sf-group">
              <label><Mail size={14} aria-hidden="true" /> E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <div className="sf-group">
              <label><Phone size={14} aria-hidden="true" /> WhatsApp</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div className="sf-group">
            <label>CPF</label>
            <input type="text" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" required inputMode="numeric" />
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

          <hr className="sf-divider" />

          <h3 className="sf-section-title"><Store size={16} aria-hidden="true" /> Dados da Loja</h3>

          <div className="sf-row">
            <div className="sf-group">
              <label><Store size={14} aria-hidden="true" /> Nome da loja</label>
              <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Minha Tabacaria" required />
            </div>
            <div className="sf-group">
              <label>Slug</label>
              <input value={storeSlug} onChange={(e) => setStoreSlug(e.target.value.replace(/[^a-z0-9-]/g, '').toLowerCase())} placeholder="minha-tabacaria" required />
            </div>
          </div>

          <div className="sf-group">
            <label><FileText size={14} aria-hidden="true" /> CNPJ</label>
            <input type="text" value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" required inputMode="numeric" />
          </div>

          <div className="sf-group">
            <label>Descrição da loja</label>
            <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} placeholder="Conte um pouco sobre sua tabacaria..." rows={3} />
          </div>

          {error && <p className="setup-error">{error}</p>}

          <button type="submit" className="setup-btn" disabled={submitting}>
            {submitting ? <><Loader size={18} className="spin" aria-hidden="true" /> Criando...</> : 'Criar conta de vendedor'}
          </button>
        </form>

        <Link to="/" className="login-skip">
          <ArrowLeft size={14} aria-hidden="true" /> Voltar para a loja
        </Link>
      </div>
    </div>
  );
}
