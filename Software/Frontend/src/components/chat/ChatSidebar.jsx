import { useRef, useEffect } from 'react'
import useChatStore from '../../store/useChatStore'
import ChatInput from './ChatInput'
import MarkdownBubble from './MarkdownBubble'

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function ChatSidebar() {
  const { messages, isLoading, extractLoading, sendMessage, chatPanelCollapsed, toggleChatPanel, schemaPreviewUrl } = useChatStore()
  const loading = isLoading || extractLoading
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <>
      {/* Sidebar panel */}
      <div className={`chat-sidebar ${chatPanelCollapsed ? 'chat-sidebar--collapsed' : ''}`}>
        {/* Header */}
        <div className="chat-sidebar__header">
          <div className="chat-sidebar__header-left">
            <span className="chat-sidebar__title">
              Chat elektra <span className="chat-sidebar__title-arrow">▾</span>
            </span>
          </div>
          <button
            className="chat-sidebar__close-btn"
            onClick={toggleChatPanel}
            title="Minimizar chat"
          >
            ✕
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
                <div className={`sidebar-bubble__time ${msg.role === 'assistant' ? '' : ''}`}
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

        {/* Circuit thumbnail */}
        {schemaPreviewUrl && (
          <div style={{ padding: '0 16px 12px' }}>
            <div className="sidebar-circuit-thumb">
              <div className="sidebar-circuit-thumb__header">
                <span className="sidebar-circuit-thumb__title">
                  🔧 Esquema del circuito
                </span>
                <div className="sidebar-circuit-thumb__actions">
                  <button className="sidebar-circuit-thumb__btn" title="Buscar">🔍</button>
                  <button className="sidebar-circuit-thumb__btn" title="Expandir">↗</button>
                </div>
              </div>
              <div className="sidebar-circuit-thumb__image">
                <img src={schemaPreviewUrl} alt="Esquema" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating expand button when sidebar is collapsed */}
      {chatPanelCollapsed && (
        <button
          className="chat-expand-btn"
          onClick={toggleChatPanel}
          title="Abrir chat"
        >
          💬
        </button>
      )}
    </>
  )
}
