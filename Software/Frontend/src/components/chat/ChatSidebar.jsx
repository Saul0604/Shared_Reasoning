import { useState, useRef, useEffect } from 'react'
import useChatStore from '../../store/useChatStore'
import ChatInput from './ChatInput'
import MarkdownBubble from './MarkdownBubble'
import { MessageSquare, X, ChevronDown, Search, Maximize2 } from 'lucide-react'

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function ChatSidebar() {
  const { messages, isLoading, extractLoading, sendMessage, chatPanelCollapsed, toggleChatPanel, schemaPreviewUrl, goBackToHistory } = useChatStore()
  const loading = isLoading || extractLoading
  const messagesEndRef = useRef(null)
  const [schemaExpanded, setSchemaExpanded] = useState(true)
  const [schemaFullscreen, setSchemaFullscreen] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className={`chat-sidebar ${chatPanelCollapsed ? 'chat-sidebar--collapsed' : ''}`}>
      {/* Header */}
      <div className="chat-sidebar__header">
        <div className="chat-sidebar__header-left">
          <MessageSquare size={18} color="#2563EB" />
          <span className="chat-sidebar__title">
            Chat elektra
          </span>
          <ChevronDown size={14} color="#9CA3AF" />
        </div>
        <button
          className="chat-sidebar__close-btn"
          onClick={toggleChatPanel}
          title="Cerrar chat"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="chat-sidebar__messages">
        {messages.map((msg, i) => (
          <div key={i}>
            <MarkdownBubble
              className={`sidebar-bubble sidebar-bubble--${msg.role}`}
              content={msg.content}
            />
            {msg.timestamp && (
              <div className={`sidebar-bubble__time`}
                style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {formatTime(msg.timestamp)}
              </div>
            )}
          </div>
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

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={loading} compact />

      {/* Circuit thumbnail — below the input */}
      {schemaPreviewUrl && (
        <div className="sidebar-circuit-thumb-wrapper">
          <div className="sidebar-circuit-thumb">
            <div className="sidebar-circuit-thumb__header" onClick={() => setSchemaExpanded(!schemaExpanded)}>
              <span className="sidebar-circuit-thumb__title">
                <Search size={14} color="#2563EB" />
                Esquema del circuito
              </span>
              <div className="sidebar-circuit-thumb__actions">
                <button
                  className="sidebar-circuit-thumb__btn"
                  onClick={(e) => { e.stopPropagation(); setSchemaExpanded(!schemaExpanded) }}
                  title={schemaExpanded ? 'Contraer' : 'Expandir'}
                >
                  <ChevronDown size={16} style={{ transform: schemaExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
                <button 
                  className="sidebar-circuit-thumb__btn" 
                  title="Pantalla completa"
                  onClick={(e) => { e.stopPropagation(); setSchemaFullscreen(true) }}
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>
            {schemaExpanded && (
              <div className="sidebar-circuit-thumb__image sidebar-circuit-thumb__image--expanded">
                <img src={schemaPreviewUrl} alt="Esquema" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
              </div>
            )}
            {!schemaExpanded && (
              <div className="sidebar-circuit-thumb__image">
                <img src={schemaPreviewUrl} alt="Esquema" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Schema Modal */}
      {schemaFullscreen && schemaPreviewUrl && (
        <div className="schema-fullscreen-modal" onClick={() => setSchemaFullscreen(false)}>
          <button 
            className="schema-fullscreen-modal__close" 
            onClick={() => setSchemaFullscreen(false)}
            title="Cerrar"
          >
            <X size={24} />
          </button>
          <img 
            src={schemaPreviewUrl} 
            alt="Esquema completo" 
            className="schema-fullscreen-modal__img"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  )
}
