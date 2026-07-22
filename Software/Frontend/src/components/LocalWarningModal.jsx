import React from 'react';
import { useTranslation } from '../utils/i18n';
import './TokenModal.css';

export default function LocalWarningModal({ isOpen, onClose, onConfirm }) {
  const { lang } = useTranslation();

  if (!isOpen) return null;

  const isEs = lang === 'es';

  return (
    <div className="token-modal-overlay">
      <div className="token-modal" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 className="token-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          🖥️ {isEs ? 'Configuración del Servidor Local' : 'Local Server Configuration'}
        </h3>

        <p className="token-modal-desc" style={{ marginBottom: '14px', fontSize: '13px', lineHeight: '1.5' }}>
          {isEs
            ? 'Para procesar esquemas y chatear usando tu propia computadora, debes iniciar tu servidor de IA local (Ollama o LM Studio) siguiendo estos pasos:'
            : 'To process schematics and chat using your computer, start your local AI server (Ollama or LM Studio) following these steps:'}
        </p>

        {/* Pasos Ollama */}
        <div style={{ background: 'rgba(241, 245, 249, 0.6)', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
            🦙 1. {isEs ? 'Si usas Ollama (Recomendado):' : 'If using Ollama (Recommended):'}
          </h4>
          <ol style={{ fontSize: '12px', paddingLeft: '18px', margin: 0, lineHeight: '1.6', color: '#334155' }}>
            <li>
              {isEs ? 'Ejecuta un modelo con ' : 'Run a model with '}
              <strong>{isEs ? 'Soporte de Visión' : 'Vision Support'}</strong>:
              <code style={{ background: '#cbd5e1', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px', fontSize: '11px', fontWeight: 'bold' }}>ollama run llava</code>
            </li>
            <li>
              {isEs ? 'Puerto HTTP local por defecto: ' : 'Default local HTTP port: '}
              <strong>11434</strong> (<code style={{ fontSize: '11px' }}>http://localhost:11434/v1</code>)
            </li>
            <li>
              <strong>{isEs ? 'Habilitar CORS (Importante):' : 'Enable CORS (Important):'}</strong>
              <div style={{ background: '#0f172a', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', marginTop: '4px', fontFamily: 'monospace', fontSize: '11px' }}>
                Windows CMD: set OLLAMA_ORIGINS=* && ollama serve<br />
                Mac/Linux: OLLAMA_ORIGINS="*" ollama serve
              </div>
            </li>
          </ol>
        </div>

        {/* Pasos LM Studio */}
        <div style={{ background: 'rgba(241, 245, 249, 0.6)', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#1e293b' }}>
            🤖 2. {isEs ? 'Si usas LM Studio:' : 'If using LM Studio:'}
          </h4>
          <ol style={{ fontSize: '12px', paddingLeft: '18px', margin: 0, lineHeight: '1.6', color: '#334155' }}>
            <li>
              {isEs ? 'Carga un modelo multimodal (ej. ' : 'Load a vision model (e.g., '}
              <strong>LLaVA 1.6</strong> o <strong>Qwen2-VL</strong>).
            </li>
            <li>
              {isEs ? 'Inicia el servidor en la pestaña ' : 'Start server in the tab '}
              <strong>Local Server</strong>.
            </li>
            <li>
              {isEs ? 'Puerto por defecto: ' : 'Default port: '}
              <strong>1234</strong> (<code style={{ fontSize: '11px' }}>http://localhost:1234/v1</code>) y activa la casilla <strong>Enable CORS</strong>.
            </li>
          </ol>
        </div>

        <div className="token-modal-actions">
          <button type="button" className="token-modal-btn-cancel" onClick={onClose}>
            {isEs ? 'Cancelar' : 'Cancel'}
          </button>
          <button type="button" className="token-modal-btn-submit" onClick={onConfirm}>
            {isEs ? 'Entendido, usar Local' : 'Got it, use Local'}
          </button>
        </div>
      </div>
    </div>
  );
}
