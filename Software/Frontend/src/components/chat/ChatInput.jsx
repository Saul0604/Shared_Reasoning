import { useState, useRef, useEffect } from 'react'
import useChatStore from '../../store/useChatStore'

const MODEL_OPTIONS = [
  { value: 'gemini', label: 'Gemini 2.5' },
  { value: 'openai', label: 'GPT-4o' },
  { value: 'local', label: 'Local' },
]

export default function ChatInput({ onSend, isLoading, compact = false }) {
  const [text, setText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const menuRef = useRef(null)
  const modelMenuRef = useRef(null)

  const selectedProvider = useChatStore((s) => s.selectedProvider)
  const setProvider = useChatStore((s) => s.setProvider)

  const currentModel = MODEL_OPTIONS.find((m) => m.value === selectedProvider) || MODEL_OPTIONS[0]

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
            <button className="chat-input__preview-remove" onClick={removeImage} title="Quitar imagen">✕</button>
          </div>
        )}
        <form className="chat-sidebar__input" onSubmit={handleSubmit}>
          <input
            className="chat-sidebar__input-field"
            type="text"
            placeholder="Escribe tu mensaje..."
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
          <button className="chat-input__preview-remove" onClick={removeImage} title="Quitar imagen">✕</button>
          <span className="chat-input__preview-name">{imageFile?.name}</span>
        </div>
      )}

      <form className="chat-input" onSubmit={handleSubmit}>
        {/* Attach button + menu */}
        <div className="chat-input__attach-wrapper" ref={menuRef}>
          <button
            type="button"
            className="chat-input__attach"
            title="Adjuntar"
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
                  <span className="chat-input__menu-title">Diagrama</span>
                  <span className="chat-input__menu-desc">Sube un esquema o diagrama de circuito</span>
                </div>
              </button>
              <button
                type="button"
                className="chat-input__menu-item chat-input__menu-item--disabled"
                disabled
              >
                <span className="chat-input__menu-icon">📷</span>
                <div className="chat-input__menu-text">
                  <span className="chat-input__menu-title">Proto armada</span>
                  <span className="chat-input__menu-desc">Foto de tu protoboard (próximamente)</span>
                </div>
                <span className="chat-input__menu-badge">Pronto</span>
              </button>
            </div>
          )}
        </div>

        <input
          className="chat-input__field"
          type="text"
          placeholder="Escribe tu mensaje..."
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
            title="Cambiar modelo de IA"
            onClick={() => setModelMenuOpen(!modelMenuOpen)}
          >
            {currentModel.label} <span className="chat-input__version-arrow">▾</span>
          </button>

          {modelMenuOpen && (
            <div className="chat-input__model-menu">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`chat-input__model-option ${selectedProvider === opt.value ? 'chat-input__model-option--active' : ''}`}
                  onClick={() => {
                    setProvider(opt.value)
                    setModelMenuOpen(false)
                  }}
                >
                  <span className="chat-input__model-dot" />
                  {opt.label}
                  {selectedProvider === opt.value && <span className="chat-input__model-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="chat-input__send"
          type="submit"
          disabled={(!text.trim() && !imageFile) || isLoading}
          title="Enviar"
        >
          ➤
        </button>
      </form>
      <p className="chat-disclaimer">
        Elektra puede cometer errores en cálculos complejos. Verifica tus diagramas antes de ensamblar.
      </p>
    </div>
  )
}
