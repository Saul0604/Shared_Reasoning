import { useState, useRef, useEffect } from 'react'
import useChatStore from '../../store/useChatStore'
import { useTranslation } from '../../utils/i18n'
import TokenModal from '../TokenModal'
import LocalWarningModal from '../LocalWarningModal'

const MODEL_OPTIONS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', isFree: true },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', isFree: false },
  { value: 'gemini-2.0-pro-exp-02-05', label: 'Gemini 2.0 Pro', isFree: false },
  { value: 'gpt-4o', label: 'GPT-4o', isFree: true },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', isFree: false },
  { value: 'o1', label: 'OpenAI o1', isFree: false },
  { value: 'local', label: 'Local', isFree: true },
]

export default function ChatInput({ onSend, isLoading, compact = false }) {
  const [text, setText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [pendingModel, setPendingModel] = useState(null)
  const [showLocalWarning, setShowLocalWarning] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const menuRef = useRef(null)
  const modelMenuRef = useRef(null)

  const selectedProvider = useChatStore((s) => s.selectedProvider)
  const setProvider = useChatStore((s) => s.setProvider)
  const { t, lang } = useTranslation()

  // Find model or fallback to first option
  let currentModel = MODEL_OPTIONS.find((m) => m.value === selectedProvider)
  if (!currentModel) {
    // Para compatibilidad hacia atrás si tenían 'gemini' u 'openai'
    if (selectedProvider === 'gemini') currentModel = MODEL_OPTIONS[0];
    else if (selectedProvider === 'openai') currentModel = MODEL_OPTIONS[3];
    else currentModel = MODEL_OPTIONS[0];
  }

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) {
        setModelMenuOpen(false)
      }
    }
    if (menuOpen || modelMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen, modelMenuOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if ((!text.trim() && !imageFile) || isLoading) return
    onSend(text.trim(), imageFile)
    setText('')
    removeImage()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
    setMenuOpen(false)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Hidden file input
  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={handleFileChange}
    />
  )

  // Compact version for the sidebar
  if (compact) {
    return (
      <div className="chat-sidebar__input-wrapper">
        {hiddenInput}
        {imagePreview && (
          <div className="chat-input__preview">
            <img src={imagePreview} alt="Preview" className="chat-input__preview-img" />
            <button className="chat-input__preview-remove" onClick={removeImage} title={lang === 'es' ? 'Quitar imagen' : 'Remove image'}>✕</button>
          </div>
        )}
        <form className="chat-sidebar__input" onSubmit={handleSubmit}>
          <input
            className="chat-sidebar__input-field"
            type="text"
            placeholder={t('chatPlaceholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className="chat-sidebar__input-send"
            type="submit"
            disabled={(!text.trim() && !imageFile) || isLoading}
          >
            ➤
          </button>
        </form>
      </div>
    )
  }

  // Full version for the main chat
  return (
    <div className="chat-input-wrapper">
      {hiddenInput}

      {/* Image Preview */}
      {imagePreview && (
        <div className="chat-input__preview">
          <img src={imagePreview} alt="Preview" className="chat-input__preview-img" />
          <button className="chat-input__preview-remove" onClick={removeImage} title={lang === 'es' ? 'Quitar imagen' : 'Remove image'}>✕</button>
          <span className="chat-input__preview-name">{imageFile?.name}</span>
        </div>
      )}

      <form className="chat-input" onSubmit={handleSubmit}>
        {/* Attach button + menu */}
        <div className="chat-input__attach-wrapper" ref={menuRef}>
          <button
            type="button"
            className="chat-input__attach"
            title={lang === 'es' ? 'Adjuntar' : 'Attach'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ＋
          </button>

          {menuOpen && (
            <div className="chat-input__menu">
              <button
                type="button"
                className="chat-input__menu-item"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="chat-input__menu-icon">📐</span>
                <div className="chat-input__menu-text">
                  <span className="chat-input__menu-title">{lang === 'es' ? 'Diagrama' : 'Diagram'}</span>
                  <span className="chat-input__menu-desc">
                    {lang === 'es' ? 'Sube un esquema o diagrama de circuito' : 'Upload a schematic or circuit diagram'}
                  </span>
                </div>
              </button>
              <button
                type="button"
                className="chat-input__menu-item chat-input__menu-item--disabled"
                disabled
              >
                <span className="chat-input__menu-icon">📷</span>
                <div className="chat-input__menu-text">
                  <span className="chat-input__menu-title">{lang === 'es' ? 'Proto armada' : 'Assembled breadboard'}</span>
                  <span className="chat-input__menu-desc">
                    {lang === 'es' ? 'Foto de tu protoboard (próximamente)' : 'Photo of your breadboard (coming soon)'}
                  </span>
                </div>
                <span className="chat-input__menu-badge">{lang === 'es' ? 'Pronto' : 'Soon'}</span>
              </button>
            </div>
          )}
        </div>

        <input
          className="chat-input__field"
          type="text"
          placeholder={t('chatPlaceholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        {/* Model selector dropdown */}
        <div className="chat-input__model-wrapper" ref={modelMenuRef}>
          <button
            type="button"
            className="chat-input__version"
            title={lang === 'es' ? 'Cambiar modelo de IA' : 'Change AI model'}
            onClick={() => setModelMenuOpen(!modelMenuOpen)}
          >
            {currentModel.label} <span className="chat-input__version-arrow">▾</span>
          </button>

          {modelMenuOpen && (
            <div className="chat-input__model-menu" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '12px', minWidth: '400px', right: '0' }}>
              {(() => {
                const renderOption = (opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`chat-input__model-option ${selectedProvider === opt.value || (selectedProvider === 'gemini' && opt.value === 'gemini-2.5-flash') || (selectedProvider === 'openai' && opt.value === 'gpt-4o') ? 'chat-input__model-option--active' : ''}`}
                    onClick={() => {
                      if (!opt.isFree) {
                        const isOpenAI = opt.value.includes('gpt') || opt.value.includes('o1');
                        const providerKey = isOpenAI ? 'openai' : 'gemini';
                        
                        if (!localStorage.getItem(`user_${providerKey}_api_key`)) {
                          const providerName = isOpenAI ? 'OpenAI' : 'Google Gemini';
                          setPendingModel({ ...opt, providerKey, providerName });
                          return;
                        }
                      } else if (opt.value === 'local') {
                        setShowLocalWarning(true);
                        return;
                      }
                      
                      setProvider(opt.value)
                      setModelMenuOpen(false)
                    }}
                  >
                    <span className="chat-input__model-dot" />
                    {opt.label}
                    {(selectedProvider === opt.value || (selectedProvider === 'gemini' && opt.value === 'gemini-2.5-flash') || (selectedProvider === 'openai' && opt.value === 'gpt-4o')) && <span className="chat-input__model-check">✓</span>}
                  </button>
                );

                return (
                  <>
                    <div className="model-menu-column">
                      <div className="model-menu-title" style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Google Gemini</div>
                      {MODEL_OPTIONS.filter(m => m.value.includes('gemini')).map(renderOption)}
                    </div>
                    <div className="model-menu-column">
                      <div className="model-menu-title" style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OpenAI</div>
                      {MODEL_OPTIONS.filter(m => m.value.includes('gpt') || m.value.includes('o1')).map(renderOption)}
                    </div>
                    <div className="model-menu-column">
                      <div className="model-menu-title" style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Local</div>
                      {MODEL_OPTIONS.filter(m => m.value === 'local').map(renderOption)}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <button
          className="chat-input__send"
          type="submit"
          disabled={(!text.trim() && !imageFile) || isLoading}
          title={t('chatSend')}
        >
          ➤
        </button>
      </form>
      <p className="chat-disclaimer">
        {lang === 'es'
          ? 'Elektra puede cometer errores en cálculos complejos. Verifica tus diagramas antes de ensamblar.'
          : 'Elektra can make mistakes. Verify your circuit diagrams before assembly.'}
      </p>

      <TokenModal
        isOpen={!!pendingModel}
        onClose={() => setPendingModel(null)}
        onSubmit={(token) => {
          if (pendingModel) {
            localStorage.setItem(`user_${pendingModel.providerKey}_api_key`, token);
            setProvider(pendingModel.value);
            setPendingModel(null);
            setModelMenuOpen(false);
          }
        }}
        providerName={pendingModel?.providerName}
        modelName={pendingModel?.label}
      />
      
      <LocalWarningModal
        isOpen={showLocalWarning}
        onClose={() => setShowLocalWarning(false)}
        onConfirm={() => {
          setProvider('local');
          setShowLocalWarning(false);
          setModelMenuOpen(false);
        }}
      />
    </div>
  )
}
