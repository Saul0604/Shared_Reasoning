import React, { useState, useEffect } from 'react';
import { useTranslation } from '../utils/i18n';
import './TokenModal.css';

export default function TokenModal({ isOpen, onClose, onSubmit, providerName, modelName }) {
  const { lang } = useTranslation();
  const [token, setToken] = useState('');

  // Clear token when opened/closed
  useEffect(() => {
    if (isOpen) setToken('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) {
      onSubmit(token.trim());
      setToken('');
    }
  };

  const handleClose = () => {
    setToken('');
    onClose();
  };

  return (
    <div className="token-modal-overlay">
      <div className="token-modal">
        <h3 className="token-modal-title">
          {lang === 'es' ? 'Requiere API Key' : 'API Key Required'}
        </h3>
        <p className="token-modal-desc">
          {lang === 'es' 
            ? `${modelName} es un modelo premium. Ingresa tu API Key de ${providerName}:` 
            : `${modelName} is a premium model. Enter your ${providerName} API Key:`}
        </p>
        <form onSubmit={handleSubmit} className="token-modal-form">
          <input
            type="text"
            autoFocus
            className="token-modal-input"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={providerName === 'OpenAI' ? 'sk-...' : 'AIza...'}
          />
          <div className="token-modal-actions">
            <button type="button" className="token-modal-btn-cancel" onClick={handleClose}>
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="submit" className="token-modal-btn-submit" disabled={!token.trim()}>
              {lang === 'es' ? 'Guardar' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
