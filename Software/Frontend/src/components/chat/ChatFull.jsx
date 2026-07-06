import { useRef, useEffect } from 'react'
import useChatStore from '../../store/useChatStore'
import ChatInput from './ChatInput'
import MarkdownBubble from './MarkdownBubble'
import { Cpu, Route, Zap, CircuitBoard } from 'lucide-react'

const suggestions = [
  {
    key: 'explain-circuit',
    icon: <Cpu size={20} color="#2563EB" />,
    title: 'Explícame este circuito',
    desc: 'Sube una imagen o esquema.',
    needsImage: true,
  },
  {
    key: 'convert-protoboard',
    icon: <Route size={20} color="#2563EB" />,
    title: 'Convierte un esquema a protoboard',
    desc: 'Traducción visual paso a paso.',
    needsImage: true,
  },
  {
    key: 'resistors',
    icon: <Zap size={20} color="#2563EB" />,
    title: 'Enséñame resistencias',
    desc: 'Código de colores y cálculo.',
    message: 'Enséñame sobre resistencias y el código de colores',
    needsImage: false,
  },
  {
    key: 'arduino',
    icon: <CircuitBoard size={20} color="#2563EB" />,
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
    goBackToHistory,
    toggleFavorite
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

  // CASO A: Si estamos viendo el Historial y no hay ninguna sesión seleccionada (Pestaña Proyectos)
  if (token && chatViewMode === 'history' && !currentSessionId) {
    // Filtrar los favoritos reales de la base de datos
    const favoritos = sessions.filter(sess => sess.is_favorite)
    const todosLosProyectos = sessions // Todos los proyectos listados abajo

    return (
      <div className="projects-dashboard">
        {/* Header Superior del Dashboard */}
        <div className="projects-dashboard__header">
          <div className="projects-dashboard__header-left">
            <h1 className="projects-dashboard__title">Proyectos</h1>
            <div className="projects-dashboard__tabs">
              <button className="projects-dashboard__tab active">Mis proyectos</button>
              <button className="projects-dashboard__tab">Compartidos</button>
              <button className="projects-dashboard__tab">Archivados</button>
            </div>
          </div>
          <div className="projects-dashboard__search-wrapper">
            <span className="search-icon-svg">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input 
              type="text" 
              className="projects-dashboard__search-input" 
              placeholder="Buscar material..." 
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Cuerpo Principal del Dashboard */}
        <div className="projects-dashboard__body">
          {/* Columna Izquierda: Grid de Proyectos */}
          <div className="projects-dashboard__main-col">
            
            {/* Sección Favoritos */}
            <div className="projects-section">
              <h2 className="projects-section__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Favoritos
              </h2>
              {favoritos.length === 0 ? (
                <div className="projects-empty-card" style={{ border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#94a3b8' }}>
                  No tienes proyectos agregados a favoritos. ¡Haz clic en la estrella de cualquier proyecto para agregarlo!
                </div>
              ) : (
                <div className="projects-grid">
                  {favoritos.map((sess) => {
                    const hasImage = !!sess.schema_image_base64
                    const previewImage = hasImage
                      ? (sess.schema_image_base64.startsWith('data:') ? sess.schema_image_base64 : `data:image/jpeg;base64,${sess.schema_image_base64}`)
                      : null
                    return (
                      <div key={`fav-${sess.id}`} className="project-card" onClick={() => selectSession(sess.id)}>
                        <div className="project-card__image-container">
                          {hasImage ? (
                            <img src={previewImage} alt={sess.title} className="project-card__image" />
                          ) : (
                            <div className="project-card__placeholder">
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.5"></rect><line x1="6" y1="12" x2="18" y2="12"></line><line x1="12" y1="6" x2="12" y2="18"></line><circle cx="6" cy="12" r="1.5" fill="#94a3b8"></circle><circle cx="18" cy="12" r="1.5" fill="#94a3b8"></circle><circle cx="12" cy="6" r="1.5" fill="#94a3b8"></circle><circle cx="12" cy="18" r="1.5" fill="#94a3b8"></circle></svg>
                            </div>
                          )}
                          <button 
                            className="project-card__fav-star-btn active-star"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(sess.id)
                            }}
                            title="Quitar de favoritos"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          </button>
                        </div>
                        <div className="project-card__content">
                          <h4 className="project-card__name">{sess.title}</h4>
                          <p className="project-card__desc">Diseño y simulación de un circuito de electrónica.</p>
                          <div className="project-card__tags">
                            {hasImage ? (
                              <>
                                <span className="project-card__tag rounded-tag--notes">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                  Apuntes
                                </span>
                                <span className="project-card__tag rounded-tag--simulation">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                  Simulación
                                </span>
                              </>
                            ) : (
                              <span className="project-card__tag rounded-tag--conversations">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                Conversación
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          className="project-card__delete-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('¿Eliminar este proyecto y todo su historial de chat?')) {
                              deleteSession(sess.id)
                            }
                          }}
                          title="Eliminar proyecto"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Sección Todos los Proyectos */}
            <div className="projects-section" style={{ marginTop: '24px' }}>
              <h2 className="projects-section__title">Todos los proyectos</h2>
              {todosLosProyectos.length === 0 ? (
                <div className="projects-dashboard__empty" style={{ padding: '60px 20px', border: '1.5px dashed #cbd5e1', borderRadius: '16px', background: '#f8fafc', textAlign: 'center' }}>
                  <p style={{ fontSize: '15px', color: '#475569', fontWeight: '600', marginBottom: '8px' }}>
                    No tienes chats.
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    Empieza una nueva conversación para visualizarla acá.
                  </p>
                </div>
              ) : (
                <div className="projects-grid">
                  {todosLosProyectos.map((sess) => {
                    const hasImage = !!sess.schema_image_base64
                    const previewImage = hasImage
                      ? (sess.schema_image_base64.startsWith('data:') ? sess.schema_image_base64 : `data:image/jpeg;base64,${sess.schema_image_base64}`)
                      : null
                    return (
                      <div key={sess.id} className="project-card" onClick={() => selectSession(sess.id)}>
                        <div className="project-card__image-container">
                          {hasImage ? (
                            <img src={previewImage} alt={sess.title} className="project-card__image" />
                          ) : (
                            <div className="project-card__placeholder">
                              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.5"></rect><line x1="6" y1="12" x2="18" y2="12"></line><line x1="12" y1="6" x2="12" y2="18"></line><circle cx="6" cy="12" r="1.5" fill="#94a3b8"></circle><circle cx="18" cy="12" r="1.5" fill="#94a3b8"></circle><circle cx="12" cy="6" r="1.5" fill="#94a3b8"></circle><circle cx="12" cy="18" r="1.5" fill="#94a3b8"></circle></svg>
                            </div>
                          )}
                          <button 
                            className={`project-card__fav-star-btn ${sess.is_favorite ? 'active-star' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(sess.id)
                            }}
                            title={sess.is_favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={sess.is_favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          </button>
                        </div>
                        <div className="project-card__content">
                          <h4 className="project-card__name">{sess.title}</h4>
                          <p className="project-card__desc">Esquema electrónico y simulación de hardware.</p>
                          <div className="project-card__tags">
                            {hasImage ? (
                              <>
                                <span className="project-card__tag rounded-tag--notes">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                  Apuntes
                                </span>
                                <span className="project-card__tag rounded-tag--simulation">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                  Simulación
                                </span>
                              </>
                            ) : (
                              <span className="project-card__tag rounded-tag--conversations">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                Conversación
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          className="project-card__delete-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('¿Eliminar este proyecto y todo su historial de chat?')) {
                              deleteSession(sess.id)
                            }
                          }}
                          title="Eliminar proyecto"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Columna Derecha: Widgets */}
          <aside className="projects-dashboard__side-col">
            {/* Widget Actividad Reciente */}
            <div className="project-widget">
              <h3 className="project-widget__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Actividad reciente
              </h3>
              <div className="project-widget__list">
                {sessions.length > 0 ? (
                  <>
                    <div className="widget-activity-item">
                      <span className="widget-activity-dot active-dot"></span>
                      <div className="widget-activity-info">
                        <p>Editaste el proyecto <strong>{sessions[0].title}</strong></p>
                        <span>Hace 2 horas</span>
                      </div>
                    </div>
                    {sessions.length > 1 && (
                      <div className="widget-activity-item">
                        <span className="widget-activity-dot"></span>
                        <div className="widget-activity-info">
                          <p>Agregaste un nuevo diagrama a <strong>{sessions[1].title}</strong></p>
                          <span>Ayer, 14:30</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="widget-empty-placeholder">No hay actividad reciente registrada.</div>
                )}
                <button className="widget-history-link">ver todo el historial</button>
              </div>
            </div>

            {/* Widget Compartidos Contigo */}
            <div className="project-widget" style={{ marginTop: '20px' }}>
              <h3 className="project-widget__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Compartidos contigo
              </h3>
              <div className="project-widget__list">
                <div className="shared-project-item">
                  <div className="shared-project-avatar" style={{ fontSize: '13px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' }}>EM</div>
                  <div className="shared-project-info">
                    <strong>Fuente Regulada 12V</strong>
                    <span>por Elena M.</span>
                  </div>
                  <span className="shared-project-tag">EDICIÓN</span>
                </div>
              </div>
            </div>
          </aside>
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
