import { useState, useEffect } from 'react'
import useChatStore from '../store/useChatStore'
import { Key, Cpu, Moon, Sun, Globe, Eye, EyeOff, Save, Trash2, CheckCircle, Info } from 'lucide-react'
import { useTranslation } from '../utils/i18n'
import TokenModal from '../components/TokenModal'
import LocalWarningModal from '../components/LocalWarningModal'
import './Settings.css'

export default function Settings() {
  const { selectedProvider, setProvider, language, setLanguage, darkMode, setDarkMode } = useChatStore()
  const { t, lang } = useTranslation()
  
  // State for API Keys
  const [geminiKey, setGeminiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  
  // Toast notifications
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Token Modal
  const [pendingModel, setPendingModel] = useState(null)
  const [showLocalWarning, setShowLocalWarning] = useState(false)

  // Load API keys on mount
  useEffect(() => {
    setGeminiKey(localStorage.getItem('user_gemini_api_key') || '')
    setOpenaiKey(localStorage.getItem('user_openai_api_key') || '')
  }, [])

  // Handle Theme toggle
  const handleThemeToggle = (checked) => {
    setDarkMode(checked)
    if (checked) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }

  // Handle Language selection
  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    triggerToast(lang === 'es' ? 'Idioma guardado correctamente.' : 'Language saved successfully.')
  }

  // Helper to trigger toast messages
  const triggerToast = (msg) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Save API Keys
  const handleSaveKeys = (e) => {
    e.preventDefault()
    localStorage.setItem('user_gemini_api_key', geminiKey.trim())
    localStorage.setItem('user_openai_api_key', openaiKey.trim())
    triggerToast(t('toastSaveKeys'))
  }

  // Clear API Keys
  const handleClearKeys = () => {
    if (window.confirm(t('confirmDeleteKeys'))) {
      localStorage.removeItem('user_gemini_api_key')
      localStorage.removeItem('user_openai_api_key')
      setGeminiKey('')
      setOpenaiKey('')
      triggerToast(t('toastDeleteKeys'))
    }
  }

  return (
    <div className="settings-page">
      {/* Toast Notification */}
      <div className={`settings-toast ${showToast ? 'show' : ''}`}>
        <CheckCircle size={18} />
        {toastMessage}
      </div>

      <TokenModal
        isOpen={!!pendingModel}
        onClose={() => setPendingModel(null)}
        onSubmit={(token) => {
          if (pendingModel) {
            localStorage.setItem(`user_${pendingModel.providerKey}_api_key`, token);
            if (pendingModel.providerKey === 'openai') setOpenaiKey(token);
            else setGeminiKey(token);
            
            setProvider(pendingModel.id);
            triggerToast(t('toastProviderChange', { name: pendingModel.name }));
            setPendingModel(null);
          }
        }}
        providerName={pendingModel?.providerName}
        modelName={pendingModel?.name}
      />

      <LocalWarningModal
        isOpen={showLocalWarning}
        onClose={() => setShowLocalWarning(false)}
        onConfirm={() => {
          setProvider('local');
          triggerToast(t('toastProviderChange', { name: 'Servidor Local' }));
          setShowLocalWarning(false);
        }}
      />

      {/* Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">
            {t('settingsTitle')}
          </h1>
          <p className="settings-subtitle">
            {t('settingsSubtitle')}
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Column: API Keys Form */}
        <form onSubmit={handleSaveKeys} className="settings-card">
          <div className="settings-card__header">
            <Key className="settings-card__icon text-blue" />
            <div>
              <h2 className="settings-card__title">
                {t('apiKeyTitle')}
              </h2>
              <p className="settings-card__subtitle">
                {t('apiKeySubtitle')}
              </p>
            </div>
          </div>

          <div className="settings-form-group">
            <label className="settings-label">
              <span>Google Gemini API Key</span>
              {!geminiKey && <span className="settings-badge-info">{t('apiUsingServer')}</span>}
            </label>
            <div className="settings-input-wrapper">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="settings-input"
              />
              <button
                type="button"
                className="settings-visibility-btn"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
              >
                {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="settings-form-group" style={{ marginTop: '16px' }}>
            <label className="settings-label">
              <span>OpenAI API Key</span>
              {!openaiKey && <span className="settings-badge-info">{t('apiUsingServer')}</span>}
            </label>
            <div className="settings-input-wrapper">
              <input
                type={showOpenaiKey ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="settings-input"
              />
              <button
                type="button"
                className="settings-visibility-btn"
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
              >
                {showOpenaiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="settings-info-box">
            <Info size={16} />
            <p>
              {t('apiKeyInfoBox')}
            </p>
          </div>

          <div className="settings-card__actions">
            <button type="submit" className="btn-save">
              <Save size={16} />
              {t('settingsBtnSave')}
            </button>
            {(geminiKey || openaiKey) && (
              <button type="button" onClick={handleClearKeys} className="btn-delete">
                <Trash2 size={16} />
                {t('settingsBtnDelete')}
              </button>
            )}
          </div>
        </form>

        {/* Right Column: Preferences & AI Model */}
        <div className="settings-column">
          {/* AI Model Settings */}
          <div className="settings-card">
            <div className="settings-card__header">
              <Cpu className="settings-card__icon text-amber" />
              <div>
                <h2 className="settings-card__title">
                  {t('providerTitle')}
                </h2>
                <p className="settings-card__subtitle">
                  {t('providerSubtitle')}
                </p>
              </div>
            </div>

            {/* Helper para renderizar tarjetas de modelos */}
            {(() => {
              const renderProvider = (provider) => (
                <div 
                  key={provider.id} 
                  className={`settings-provider-card ${selectedProvider === provider.id || (selectedProvider === 'gemini' && provider.id === 'gemini-2.5-flash') || (selectedProvider === 'openai' && provider.id === 'gpt-4o') ? 'active' : ''}`}
                  onClick={() => {
                    if (!provider.isFree) {
                      const isOpenAI = provider.id.includes('gpt') || provider.id.includes('o1');
                      const providerKey = isOpenAI ? 'openai' : 'gemini';
                      const currentKey = isOpenAI ? openaiKey : geminiKey;
                      
                      if (!currentKey) {
                        const providerName = isOpenAI ? 'OpenAI' : 'Google Gemini';
                        setPendingModel({ ...provider, providerKey, providerName });
                        return;
                      }
                    } else if (provider.id === 'local') {
                      setShowLocalWarning(true);
                      return;
                    }
                    setProvider(provider.id)
                    triggerToast(t('toastProviderChange', { name: provider.name }))
                  }}
                  style={{ marginBottom: '8px' }}
                >
                  <div className="provider-check">
                    <div className="provider-check-circle" />
                  </div>
                  <div>
                    <h3 className="provider-name" style={{ fontSize: '13px' }}>{provider.name}</h3>
                    <p className="provider-desc" style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{provider.desc}</p>
                  </div>
                </div>
              );

              return (
                <div className="settings-providers-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {/* Columna Gemini */}
                  <div className="provider-column">
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Google Gemini</h4>
                    {[
                      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Gratis, rápido y eficiente.', isFree: true },
                      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Avanzado (Requiere API Key).', isFree: false },
                      { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro', desc: 'Experimental (Requiere API Key).', isFree: false },
                    ].map(renderProvider)}
                  </div>

                  {/* Columna OpenAI */}
                  <div className="provider-column">
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OpenAI</h4>
                    {[
                      { id: 'gpt-4o', name: 'GPT-4o', desc: 'Gratis, inteligente y multimodal.', isFree: true },
                      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: 'Avanzado (Requiere API Key).', isFree: false },
                      { id: 'o1', name: 'OpenAI o1', desc: 'Razonamiento profundo (Requiere API Key).', isFree: false },
                    ].map(renderProvider)}
                  </div>

                  {/* Columna Local */}
                  <div className="provider-column">
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Local</h4>
                    {[
                      { id: 'local', name: 'Servidor Local', desc: t('providerLocalDesc'), isFree: true }
                    ].map(renderProvider)}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Preferences Settings */}
          <div className="settings-card" style={{ marginTop: '16px' }}>
            <div className="settings-card__header">
              {darkMode ? (
                <Moon className="settings-card__icon text-purple" />
              ) : (
                <Sun className="settings-card__icon text-purple" />
              )}
              <div>
                <h2 className="settings-card__title">
                  {t('prefTitle')}
                </h2>
                <p className="settings-card__subtitle">
                  {t('prefSubtitle')}
                </p>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <div className="settings-preference-row">
              <div>
                <h3 className="preference-title">
                  {t('prefDarkMode')}
                </h3>
                <p className="preference-desc">
                  {t('prefDarkModeDesc')}
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => handleThemeToggle(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Language Selection */}
            <div className="settings-preference-row" style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <div>
                <h3 className="preference-title">
                  {t('prefLang')}
                </h3>
                <p className="preference-desc">
                  {t('prefLangDesc')}
                </p>
              </div>
              <div className="language-selector-wrapper">
                <Globe size={16} className="lang-icon" />
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="language-select"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}