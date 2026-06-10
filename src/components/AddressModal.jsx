import { useState, useEffect } from 'react';
import { MapPin, Plus, X, Check, ChevronDown, ChevronUp, Home, Building, Navigation } from 'lucide-react';
import * as client from '../api/client';

const EMPTY_FORM = {
  street: '', number: '', complement: '', neighborhood: '',
  city: 'São Paulo', state: 'SP', cep: '', isDefault: false
};

export default function AddressModal({ open, onClose, onSelect, selectedId, onAddressCreated }) {
  const [addresses, setAddresses] = useState([]);
  const [localSelected, setLocalSelected] = useState(selectedId || '');
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      client.fetchAddresses()
        .then((addrs) => {
          setAddresses(addrs);
          if (!localSelected && addrs.length > 0) {
            const def = addrs.find((a) => a.isDefault) || addrs[0];
            setLocalSelected(def.id);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  function handleConfirm() {
    const addr = addresses.find((a) => a.id === localSelected);
    if (addr) {
      onSelect(addr);
      onClose();
    }
  }

  function handleDelete(addrId, e) {
    e.stopPropagation();
    client.deleteAddress(addrId)
      .then(() => {
        setAddresses((prev) => prev.filter((a) => a.id !== addrId));
        if (localSelected === addrId) setLocalSelected('');
      })
      .catch(() => {});
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const addr = await client.createAddress(form);
      setAddresses((prev) => [...prev, addr]);
      setLocalSelected(addr.id);
      setShowNew(false);
      setForm(EMPTY_FORM);
      if (onAddressCreated) onAddressCreated(addr);
    } catch (err) {
      // silent
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content address-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><MapPin size={18} aria-hidden="true" /> Endereço de Entrega</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </div>

        <div className="modal-body">
          {addresses.length > 0 && (
            <div className="am-list">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`am-option${localSelected === addr.id ? ' selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="am-addr"
                    checked={localSelected === addr.id}
                    onChange={() => setLocalSelected(addr.id)}
                  />
                  <div className="am-card">
                    <div className="am-card-icon">
                      {addr.isDefault ? <Home size={18} /> : <Building size={18} />}
                    </div>
                    <div className="am-card-info">
                      <span className="am-card-street">{addr.street}, {addr.number}</span>
                      <span className="am-card-neighborhood">
                        {addr.neighborhood} — {addr.city}/{addr.state}
                      </span>
                      {addr.complement && <span className="am-card-complement">{addr.complement}</span>}
                      <span className="am-card-cep">{addr.cep}</span>
                    </div>
                    <div className="am-card-actions">
                      {addr.isDefault && <span className="am-badge">Padrão</span>}
                      <button
                        type="button"
                        className="am-delete"
                        onClick={(e) => handleDelete(addr.id, e)}
                        aria-label="Remover endereço"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  {localSelected === addr.id && <Check size={18} className="am-check" aria-hidden="true" />}
                </label>
              ))}
            </div>
          )}

          {addresses.length === 0 && !showNew && (
            <div className="am-empty">
              <Navigation size={32} aria-hidden="true" />
              <p>Nenhum endereço salvo.</p>
            </div>
          )}

          <button
            type="button"
            className="am-toggle-new"
            onClick={() => setShowNew((v) => !v)}
          >
            {showNew ? <ChevronUp size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
            {showNew ? 'Fechar formulário' : 'Novo endereço'}
          </button>

          {showNew && (
            <form className="am-form" onSubmit={handleCreate}>
              <div className="am-row">
                <div className="am-field" style={{ flex: 2 }}>
                  <label>Rua</label>
                  <input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} required />
                </div>
                <div className="am-field" style={{ flex: 1 }}>
                  <label>Número</label>
                  <input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} required />
                </div>
              </div>
              <div className="am-row">
                <div className="am-field">
                  <label>Complemento</label>
                  <input value={form.complement} onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))} />
                </div>
                <div className="am-field">
                  <label>Bairro</label>
                  <input value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))} required />
                </div>
              </div>
              <div className="am-row">
                <div className="am-field" style={{ flex: 2 }}>
                  <label>Cidade</label>
                  <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
                </div>
                <div className="am-field" style={{ flex: 1 }}>
                  <label>Estado</label>
                  <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} maxLength={2} required />
                </div>
                <div className="am-field" style={{ flex: 1 }}>
                  <label>CEP</label>
                  <input value={form.cep} onChange={(e) => setForm((f) => ({ ...f, cep: e.target.value }))} required />
                </div>
              </div>
              <label className="am-default-toggle">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                />
                Usar como endereço padrão
              </label>
              <button type="submit" className="am-save" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar endereço'}
              </button>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="modal-btn-primary"
            onClick={handleConfirm}
            disabled={!localSelected}
          >
            Confirmar endereço
          </button>
        </div>
      </div>
    </div>
  );
}
