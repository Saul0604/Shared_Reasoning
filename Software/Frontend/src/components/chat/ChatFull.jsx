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
  const { messages, isLoading, sendMessage, extractFromImage, extractLoading } = useChatStore()
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const hasMessages = messages.length > 0
  const loading = isLoading || extractLoading

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.needsImage) {
      // Open file picker — the image will be sent through extractFromImage
      fileInputRef.current?.click()
    } else {
      sendMessage(suggestion.message)
    }
  }

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    extractFromImage(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="chat-full">
      {/* Hidden file input for suggestion cards that need images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {!hasMessages ? (
        /* Welcome Screen */
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
        /* Messages */
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <MarkdownBubble
              key={i}
              className={`chat-bubble chat-bubble--${msg.role}`}
              content={msg.content}
            />
          ))}

          {(loading) && (
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
