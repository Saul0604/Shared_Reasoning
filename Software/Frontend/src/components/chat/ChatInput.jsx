import { useState, useRef, useEffect } from 'react'

export default function ChatInput({ onSend, isLoading, compact = false }) {
  const [text, setText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

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

        <button type="button" className="chat-input__version" title="Cambiar versión">
          3.1 Pro <span className="chat-input__version-arrow">▾</span>
        </button>

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
