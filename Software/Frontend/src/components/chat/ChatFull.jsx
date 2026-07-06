import { useRef, useEffect } from 'react'
import useChatStore from '../../store/useChatStore'
import ChatInput from './ChatInput'
import MarkdownBubble from './MarkdownBubble'

const suggestions = [
  {
    key: 'explain-circuit',
    icon: '🔍',
    title: 'Explícame este circuito',
    desc: 'Sube una imagen o esquema.',
    needsImage: true,
  },
  {
    key: 'convert-protoboard',
    icon: '🔄',
    title: 'Convierte un esquema a protoboard',
    desc: 'Traducción visual paso a paso.',
    needsImage: true,
  },
  {
    key: 'resistors',
    icon: '🎨',
    title: 'Enséñame resistencias',
    desc: 'Código de colores y cálculo.',
    message: 'Enséñame sobre resistencias y el código de colores',
    needsImage: false,
  },
  {
    key: 'arduino',
    icon: '🤖',
    title: 'Diseña un circuito para Arduino',
    desc: 'Guía de conexiones y código.',
    message: 'Diseña un circuito para Arduino con LED y explícame cómo armarlo',
    needsImage: false,
  },
]

export default function ChatFull() {
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    extractFromImage, 
    extractLoading,
    sessions,
    currentSessionId,
    selectSession,
    createNewSession,
    deleteSession,
    clearChat,
    chatViewMode,
    goBackToHistory
  } = useChatStore()

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loading = isLoading || extractLoading

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.needsImage) {
      fileInputRef.current?.click()
    } else {
      sendMessage(suggestion.message)
    }
  }

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    extractFromImage(file)
    e.target.value = ''
  }

  const token = localStorage.getItem('access_token')

  // CASO A: Si estamos viendo el Historial y no hay ninguna sesión seleccionada
  if (token && chatViewMode === 'history' && !currentSessionId) {
    return (
      <div className="chat-dashboard">
        <div className="chat-dashboard__header">
          <h1 className="chat-dashboard__title">Historial de Circuitos</h1>
        </div>

        <div className="chat-dashboard__content">
          <div className="chat-dashboard__section">
            {sessions.length === 0 ? (
              <div className="chat-dashboard__empty" style={{ padding: '60px 20px', border: '1.5px dashed #cbd5e1' }}>
                <p style={{ fontSize: '15px', color: '#475569', fontWeight: '600', marginBottom: '8px' }}>
                  No tienes chats.
                </p>
                <p style={{ fontSize: '13px', color: '#64748b' }}>
                  Empieza una nueva conversación para visualizarla acá.
                </p>
              </div>
            ) : (
              <>
                <h3>Selecciona una conversación previa:</h3>
                <div className="chat-dashboard__grid">
                  {sessions.map((sess) => (
                    <div key={sess.id} className="chat-dashboard__card" onClick={() => selectSession(sess.id)}>
                      <div className="chat-dashboard__card-icon">💬</div>
                      <div className="chat-dashboard__card-info">
                        <h4>{sess.title}</h4>
                        <span>Creado el: {new Date(sess.created_at).toLocaleDateString()}</span>
                      </div>
                      <button 
                        className="chat-dashboard__card-delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('¿Eliminar este circuito y todo su historial de chat?')) {
                            deleteSession(sess.id)
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // CASO B: Si hay un chat seleccionado o estamos en modo "new_chat"
  return (
    <div className="chat-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {currentSessionId && (
        <div className="chat-full__header">
          <button className="chat-full__back-btn" onClick={() => goBackToHistory()}>
            ⬅ Volver al Historial
          </button>
          <span className="chat-full__session-title">
            {sessions.find(s => s.id === currentSessionId)?.title || "Conversación"}
          </span>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="chat-welcome">
          <h1 className="chat-welcome__title">¿Qué deseas aprender hoy?</h1>
          <div className="chat-welcome__cards">
            {suggestions.map((s) => (
              <button
                key={s.key}
                className="chat-welcome__card"
                onClick={() => handleSuggestionClick(s)}
                disabled={loading}
              >
                <span className="chat-welcome__card-icon">{s.icon}</span>
                <div className="chat-welcome__card-content">
                  <span className="chat-welcome__card-title">{s.title}</span>
                  <span className="chat-welcome__card-desc">{s.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <MarkdownBubble
              key={i}
              className={`chat-bubble chat-bubble--${msg.role}`}
              content={msg.content}
            />
          ))}

          {loading && (
            <div className="chat-loading">
              <div className="chat-loading__dot" />
              <div className="chat-loading__dot" />
              <div className="chat-loading__dot" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <ChatInput onSend={sendMessage} isLoading={loading} />
    </div>
  )
}
