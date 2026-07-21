import React from 'react';
import { useTranslation } from '../utils/i18n';
import './TokenModal.css';

export default function LocalWarningModal({ isOpen, onClose, onConfirm }) {
  const { lang } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="token-modal-overlay">
      <div className="token-modal" style={{ maxWidth: '450px' }}>
        <h3 className="token-modal-title">
          {lang === 'es' ? 'Modo Local' : 'Local Mode'}
        </h3>

        <p className="token-modal-desc" style={{ marginBottom: '16px' }}>
          {lang === 'es'
            ? 'Al ejecutar Elektra con un servidor local, la inteligencia, precisión y velocidad dependerán completamente del modelo instalado y la potencia de tu equipo.'
            : 'When running Elektra with a local server, intelligence, precision, and speed depend entirely on the installed model and your computer\'s power.'}
        </p>

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'inherit' }}>
            {lang === 'es' ? 'Recomendaciones:' : 'Recommendations:'}
          </h4>
          <ul style={{ fontSize: '14px', color: 'inherit', opacity: 0.85, paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>
              <strong>{lang === 'es' ? 'Características del modelo:' : 'Model characteristics:'}</strong> {lang === 'es' ? 'Debe ser multimodal (capaz de analizar imágenes) y tener entre 7B y 8B parámetros para un buen razonamiento.' : 'Must be multimodal (vision-capable) and have between 7B and 8B parameters for proper reasoning.'}
            </li>
            <li>
              <strong>{lang === 'es' ? 'Hardware sugerido:' : 'Suggested hardware:'}</strong> {lang === 'es' ? '16GB de RAM unificada o dedicada para correr con fluidez.' : '16GB of unified or dedicated RAM to run smoothly.'}
            </li>
            <li>
              <strong>{lang === 'es' ? 'Servidor activo:' : 'Active server:'}</strong> {lang === 'es' ? 'Asegúrate de que Ollama esté encendido y el puerto local abierto.' : 'Ensure Ollama is running and the local port is open.'}
            </li>
          </ul>
        </div>

        <div className="token-modal-actions">
          <button type="button" className="token-modal-btn-cancel" onClick={onClose}>
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button type="button" className="token-modal-btn-submit" onClick={onConfirm}>
            {lang === 'es' ? 'Continuar y usar Local' : 'Continue using Local'}
          </button>
        </div>
      </div>
    </div>
  );
}
