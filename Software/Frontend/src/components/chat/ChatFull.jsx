import { useRef, useEffect, useState } from 'react'
import useChatStore from '../../store/useChatStore'
import ChatInput from './ChatInput'
import MarkdownBubble from './MarkdownBubble'
import { useTranslation } from '../../utils/i18n'
import { Cpu, Route, Zap, CircuitBoard, Share2, Clipboard, Edit, Loader2, Archive } from 'lucide-react'

const getSuggestions = (lang) => [
  {
    key: 'explain-circuit',
    icon: <Cpu size={20} color="#2563EB" />,
    title: lang === 'es' ? 'Explícame este circuito' : 'Explain this circuit',
    desc: lang === 'es' ? 'Sube una imagen o esquema.' : 'Upload an image or schematic.',
    needsImage: true,
  },
  {
    key: 'convert-protoboard',
    icon: <Route size={20} color="#2563EB" />,
    title: lang === 'es' ? 'Convierte un esquema a protoboard' : 'Convert schematic to breadboard',
    desc: lang === 'es' ? 'Traducción visual paso a paso.' : 'Step-by-step visual translation.',
    needsImage: true,
  },
  {
    key: 'resistors',
    icon: <Zap size={20} color="#2563EB" />,
    title: lang === 'es' ? 'Enséñame resistencias' : 'Teach me about resistors',
    desc: lang === 'es' ? 'Código de colores y cálculo.' : 'Color code and calculations.',
    message: lang === 'es' ? 'Enséñame sobre resistencias y el código de colores' : 'Teach me about resistors and the color code',
    needsImage: false,
  },
  {
    key: 'arduino',
    icon: <CircuitBoard size={20} color="#2563EB" />,
    title: lang === 'es' ? 'Diseña un circuito para Arduino' : 'Design an Arduino circuit',
    desc: lang === 'es' ? 'Guía de conexiones y código.' : 'Connection guide and code.',
    message: lang === 'es' ? 'Diseña un circuito para Arduino con LED y explícame cómo armarlo' : 'Design an Arduino circuit with LED and explain how to assemble it',
    needsImage: false,
  },
]

export default function ChatFull() {
  const [activeTab, setActiveTab] = useState('mis_proyectos')
  const [toastMessage, setToastMessage] = useState(null)
  const [sessionToDelete, setSessionToDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { t, lang } = useTranslation()

  // Estados para renombrar
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [editTitleValue, setEditTitleValue] = useState('')

  const {
    messages,
    isLoading,
    sendMessage,
    extractFromImage,
    extractLoading,
    sessions,
    archivedSessions,
    currentSessionId,
    selectSession,
    createNewSession,
    deleteSession,
    clearChat,
    chatViewMode,
    goBackToHistory,
    toggleFavorite,
    sharedSessions,
    loadSharedProjects,
    generateShareLink,
    renameSession,
    dashboardLoading,
    toggleArchiveSession
  } = useChatStore()

  const token = localStorage.getItem('access_token')
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cargar compartidos al montar
  useEffect(() => {
    if (token) {
      loadSharedProjects()
    }
  }, [token])

  const handleShareClick = async (e, chatId) => {
    e.stopPropagation()
    const link = await generateShareLink(chatId)
    if (link) {
      navigator.clipboard.writeText(link)
      setToastMessage(lang === 'es' ? '¡Enlace de compartición copiado al portapapeles! 🔗' : 'Share link copied to clipboard! 🔗')
      setTimeout(() => setToastMessage(null), 3000)
    }
  }

  const handleRenameSave = async (sessionId) => {
    if (editTitleValue.trim()) {
      await renameSession(sessionId, editTitleValue.trim())
    }
    setEditingSessionId(null)
  }

  const handleArchiveToggle = async (e, chatId, isCurrentlyArchived) => {
    e.stopPropagation()
    await toggleArchiveSession(chatId, isCurrentlyArchived)
  }

  const handleSuggestionClick = (s) => {
    if (s.needsImage) {
      fileInputRef.current?.click()
    } else if (s.message) {
      sendMessage(s.message)
    }
  }

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    extractFromImage(file)
  }

  // CASO A: Si estamos en modo dashboard (historial de proyectos)
  if (chatViewMode === 'history' && !currentSessionId) {
    // Filtrar proyectos favoritos
    let favoritos = sessions.filter(s => s.is_favorite)
    if (searchTerm.trim() !== '') {
      favoritos = favoritos.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Determinar qué proyectos se muestran en la sección principal
    let proyectosAMostrar = activeTab === 'compartidos'
      ? sharedSessions
      : activeTab === 'archivados'
        ? archivedSessions
        : sessions

    if (searchTerm.trim() !== '') {
      proyectosAMostrar = proyectosAMostrar.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    return (
      <div className="projects-dashboard">
        {/* Toast Notificación */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#1e293b',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'popoverFadeIn 0.2s ease-out'
          }}>
            {toastMessage}
          </div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {sessionToDelete && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#1e293b' }}>
                {lang === 'es' ? '¿Eliminar proyecto?' : 'Delete project?'}
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b' }}>
                {lang === 'es' 
                  ? 'Esta acción eliminará el proyecto y todo su historial de chat. No se puede deshacer.' 
                  : 'This action will delete the project and all its chat history. It cannot be undone.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setSessionToDelete(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#475569',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button 
                  onClick={() => {
                    deleteSession(sessionToDelete)
                    setSessionToDelete(null)
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'es' ? 'Eliminar' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Superior del Dashboard */}
        <div className="projects-dashboard__header">
          <div className="projects-dashboard__header-left">
            <h1 className="projects-dashboard__title">{lang === 'es' ? 'Proyectos' : 'Projects'}</h1>
            <div className="projects-dashboard__tabs">
              <button
                className={`projects-dashboard__tab ${activeTab === 'mis_proyectos' ? 'active' : ''}`}
                onClick={() => setActiveTab('mis_proyectos')}
              >
                {lang === 'es' ? 'Mis proyectos' : 'My projects'}
              </button>
              <button
                className={`projects-dashboard__tab ${activeTab === 'compartidos' ? 'active' : ''}`}
                onClick={() => setActiveTab('compartidos')}
              >
                {lang === 'es' ? 'Compartidos' : 'Shared'}
              </button>
              <button
                className={`projects-dashboard__tab ${activeTab === 'archivados' ? 'active' : ''}`}
                onClick={() => setActiveTab('archivados')}
              >
                {lang === 'es' ? 'Archivados' : 'Archived'}
              </button>
            </div>
          </div>
          <div className="projects-dashboard__search-wrapper">
            <span className="search-icon-svg">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input
              id="search-proyectos"
              type="text"
              className="projects-dashboard__search-input"
              placeholder={lang === 'es' ? 'Buscar proyecto...' : 'Search project...'}
              style={{ paddingLeft: '36px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Cuerpo Principal del Dashboard */}
        <div className="projects-dashboard__body">
          {/* Columna Izquierda: Grid de Proyectos */}
          <div className="projects-dashboard__main-col">

            {dashboardLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
                <Loader2 size={36} className="premium-spinner" style={{ color: '#2563eb', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-color, #1e293b)', margin: '0 0 4px 0' }}>
                  {lang === 'es' ? 'Buscando tus proyectos...' : 'Looking for your projects...'}
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  {lang === 'es' ? 'Consultando tus diagramas y simulaciones en la base de datos.' : 'Checking your diagrams and simulations in the database.'}
                </p>
              </div>
            ) : (
              <>
                {/* Sección Favoritos - Solo se muestra en 'Mis proyectos' */}
                {activeTab === 'mis_proyectos' && (
                  <div className="projects-section">
                    <h2 className="projects-section__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      {lang === 'es' ? 'Favoritos' : 'Favorites'}
                    </h2>
                    {favoritos.length === 0 ? (
                      <div className="projects-empty-card" style={{ border: '1px dashed #cbd5e1', background: 'var(--empty-card-bg, #f8fafc)', color: '#94a3b8' }}>
                        {lang === 'es' 
                          ? 'No tienes proyectos agregados a favoritos. ¡Haz clic en la estrella de cualquier proyecto para agregarlo!' 
                          : 'You have no projects added to favorites. Click the star on any project to add it!'}
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
                                  title={lang === 'es' ? "Quitar de favoritos" : "Remove from favorites"}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                </button>
                                <button
                                  className="project-card__share-btn"
                                  onClick={(e) => handleShareClick(e, sess.id)}
                                  title={lang === 'es' ? "Compartir proyecto" : "Share project"}
                                  style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '42px',
                                    background: 'var(--star-btn-bg, white)',
                                    border: '1px solid var(--star-btn-border, #e2e8f0)',
                                    borderRadius: '50%',
                                    width: '26px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#64748b',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                    transition: 'all 0.15s',
                                    zIndex: 10
                                  }}
                                >
                                  <Share2 size={12} />
                                </button>
                                <button
                                  className="project-card__archive-btn"
                                  onClick={(e) => handleArchiveToggle(e, sess.id, sess.is_archived)}
                                  title={sess.is_archived ? (lang === 'es' ? "Desarchivar proyecto" : "Unarchive project") : (lang === 'es' ? "Archivar proyecto" : "Archive project")}
                                  style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '74px',
                                    background: 'var(--star-btn-bg, white)',
                                    border: '1px solid var(--star-btn-border, #e2e8f0)',
                                    borderRadius: '50%',
                                    width: '26px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: sess.is_archived ? '#2563eb' : '#64748b',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                    transition: 'all 0.15s',
                                    zIndex: 10
                                  }}
                                >
                                  <Archive size={12} />
                                </button>
                              </div>
                              <div className="project-card__content">
                                {editingSessionId === 'fav-' + sess.id ? (
                                  <input
                                    type="text"
                                    value={editTitleValue}
                                    onChange={(e) => setEditTitleValue(e.target.value)}
                                    onBlur={() => handleRenameSave(sess.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRenameSave(sess.id)
                                      if (e.key === 'Escape') setEditingSessionId(null)
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    style={{
                                      width: '100%',
                                      padding: '4px 8px',
                                      fontSize: '14px',
                                      fontWeight: '700',
                                      border: '2px solid #2563eb',
                                      borderRadius: '6px',
                                      outline: 'none',
                                      color: '#1e293b'
                                    }}
                                  />
                                ) : (
                                  <h4 className="project-card__name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span>{sess.title}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingSessionId('fav-' + sess.id)
                                        setEditTitleValue(sess.title)
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#94a3b8',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderRadius: '4px',
                                        transition: 'color 0.2s'
                                      }}
                                      title={lang === 'es' ? "Editar nombre" : "Edit name"}
                                    >
                                      <Edit size={12} />
                                    </button>
                                  </h4>
                                )}
                                <p className="project-card__desc">
                                  {lang === 'es' ? 'Diseño y simulación de un circuito de electrónica.' : 'Electronics circuit design and simulation.'}
                                </p>
                                <div className="project-card__tags">
                                  {hasImage ? (
                                    <>
                                      <span className="project-card__tag rounded-tag--notes">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        {lang === 'es' ? 'Apuntes' : 'Notes'}
                                      </span>
                                      <span className="project-card__tag rounded-tag--simulation">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                        {lang === 'es' ? 'Simulación' : 'Simulation'}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="project-card__tag rounded-tag--conversations">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                      {lang === 'es' ? 'Conversación' : 'Conversation'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                className="project-card__delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSessionToDelete(sess.id)
                                }}
                                title={lang === 'es' ? "Eliminar proyecto" : "Delete project"}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Sección Todos los Proyectos o Compartidos */}
                <div id="todos-los-proyectos" className="dashboard-section" style={{ marginTop: '32px' }}>
                  <h2 className="projects-section__title">
                    {activeTab === 'compartidos'
                      ? (lang === 'es' ? 'Proyectos compartidos contigo' : 'Projects shared with you')
                      : activeTab === 'archivados'
                        ? (lang === 'es' ? 'Proyectos archivados' : 'Archived projects')
                        : (lang === 'es' ? 'Todos los proyectos' : 'All projects')}
                  </h2>
                  {proyectosAMostrar.length === 0 ? (
                    <div className="projects-dashboard__empty" style={{ padding: '60px 20px', border: '1.5px dashed #cbd5e1', borderRadius: '16px', background: 'var(--empty-card-bg, #f8fafc)', textAlign: 'center' }}>
                      <p style={{ fontSize: '15px', color: 'var(--text-color, #475569)', fontWeight: '600', marginBottom: '8px' }}>
                        {activeTab === 'compartidos'
                          ? (lang === 'es' ? 'No tienes proyectos compartidos.' : 'You have no shared projects.')
                          : activeTab === 'archivados'
                            ? (lang === 'es' ? 'No tienes proyectos archivados.' : 'You have no archived projects.')
                            : (lang === 'es' ? 'No tienes chats.' : 'You have no chats.')}
                      </p>
                      <p style={{ fontSize: '13px', color: '#64748b' }}>
                        {activeTab === 'compartidos'
                          ? (lang === 'es' ? 'Pídele a tus compañeros que te compartan sus enlaces.' : 'Ask your classmates to share their links.')
                          : activeTab === 'archivados'
                            ? (lang === 'es' ? 'Aquí se mostrarán los proyectos que decidas archivar.' : 'Projects you decide to archive will appear here.')
                            : (lang === 'es' ? 'Inicia una nueva conversación para verla aquí.' : 'Start a new conversation to see it here.')}
                      </p>
                    </div>
                  ) : (
                    <div className="projects-grid">
                      {proyectosAMostrar.map((sess) => {
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
                                title={sess.is_favorite ? (lang === 'es' ? "Quitar de favoritos" : "Remove from favorites") : (lang === 'es' ? "Agregar a favoritos" : "Add to favorites")}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={sess.is_favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                              </button>
                              <button
                                className="project-card__share-btn"
                                onClick={(e) => handleShareClick(e, sess.id)}
                                title={lang === 'es' ? "Compartir proyecto" : "Share project"}
                                style={{
                                  position: 'absolute',
                                  top: '10px',
                                  right: '42px',
                                  background: 'var(--star-btn-bg, white)',
                                  border: '1px solid var(--star-btn-border, #e2e8f0)',
                                  borderRadius: '50%',
                                  width: '26px',
                                  height: '26px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#64748b',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                  transition: 'all 0.15s',
                                  zIndex: 10
                                }}
                              >
                                <Share2 size={12} />
                              </button>
                              <button
                                  className="project-card__archive-btn"
                                  onClick={(e) => handleArchiveToggle(e, sess.id, sess.is_archived)}
                                  title={sess.is_archived ? (lang === 'es' ? "Desarchivar proyecto" : "Unarchive project") : (lang === 'es' ? "Archivar proyecto" : "Archive project")}
                                  style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '74px',
                                    background: 'var(--star-btn-bg, white)',
                                    border: '1px solid var(--star-btn-border, #e2e8f0)',
                                    borderRadius: '50%',
                                    width: '26px',
                                    height: '26px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: sess.is_archived ? '#2563eb' : '#64748b',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                    transition: 'all 0.15s',
                                    zIndex: 10
                                  }}
                                >
                                  <Archive size={12} />
                                </button>
                            </div>
                            <div className="project-card__content">
                              {editingSessionId === 'all-' + sess.id ? (
                                <input
                                  type="text"
                                  value={editTitleValue}
                                  onChange={(e) => setEditTitleValue(e.target.value)}
                                  onBlur={() => handleRenameSave(sess.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSave(sess.id)
                                    if (e.key === 'Escape') setEditingSessionId(null)
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                  style={{
                                    width: '100%',
                                    padding: '4px 8px',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    border: '2px solid #2563eb',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    color: '#1e293b'
                                  }}
                                />
                              ) : (
                                <h4 className="project-card__name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                  <span>{sess.title}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingSessionId('all-' + sess.id)
                                      setEditTitleValue(sess.title)
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: '#94a3b8',
                                      padding: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      borderRadius: '4px',
                                      transition: 'color 0.2s'
                                    }}
                                    title={lang === 'es' ? "Editar nombre" : "Edit name"}
                                  >
                                    <Edit size={12} />
                                  </button>
                                </h4>
                              )}
                              <p className="project-card__desc">
                                {lang === 'es' ? 'Esquema electrónico y simulación de hardware.' : 'Electronic schematic and hardware simulation.'}
                              </p>
                              <div className="project-card__tags">
                                {hasImage ? (
                                  <>
                                    <span className="project-card__tag rounded-tag--notes">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                      {lang === 'es' ? 'Apuntes' : 'Notes'}
                                    </span>
                                    <span className="project-card__tag rounded-tag--simulation">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                      {lang === 'es' ? 'Simulación' : 'Simulation'}
                                    </span>
                                  </>
                                ) : (
                                  <span className="project-card__tag rounded-tag--conversations">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    {lang === 'es' ? 'Conversación' : 'Conversation'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              className="project-card__delete-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                  setSessionToDelete(sess.id)
                              }}
                              title={lang === 'es' ? "Eliminar proyecto" : "Delete project"}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Columna Derecha: Widgets */}
          <aside className="projects-dashboard__side-col">
            {/* Widget Actividad Reciente */}
            <div className="project-widget">
              <h3 className="project-widget__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {lang === 'es' ? 'Actividad reciente' : 'Recent activity'}
              </h3>
              <div className="project-widget__list">
                {sessions.length > 0 ? (
                  <>
                    <div className="widget-activity-item">
                      <span className="widget-activity-dot active-dot"></span>
                      <div className="widget-activity-info">
                        <p>
                          {lang === 'es' ? 'Editaste el proyecto' : 'You edited project'} <strong>{sessions[0].title}</strong>
                        </p>
                        <span>{lang === 'es' ? 'Hace 2 horas' : '2 hours ago'}</span>
                      </div>
                    </div>
                    {sessions.length > 1 && (
                      <div className="widget-activity-item">
                        <span className="widget-activity-dot"></span>
                        <div className="widget-activity-info">
                          <p>
                            {lang === 'es' ? 'Agregaste un nuevo diagrama a' : 'You added a new diagram to'} <strong>{sessions[1].title}</strong>
                          </p>
                          <span>{lang === 'es' ? 'Ayer, 14:30' : 'Yesterday, 14:30'}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="widget-empty-placeholder">
                    {lang === 'es' ? 'No hay actividad reciente registrada.' : 'No recent activity recorded.'}
                  </div>
                )}
                <button 
                  className="widget-history-link"
                  onClick={() => {
                    setActiveTab('mis_proyectos');
                    const el = document.getElementById('search-proyectos');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => el.focus(), 300);
                    }
                  }}
                >
                  {lang === 'es' ? 'ver todo el historial' : 'view full history'}
                </button>
              </div>
            </div>

            {/* Widget Compartidos Contigo */}
            <div className="project-widget" style={{ marginTop: '20px' }}>
              <h3 className="project-widget__title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                {lang === 'es' ? 'Compartidos contigo' : 'Shared with you'}
              </h3>
              <div className="project-widget__list">
                {sharedSessions.length > 0 ? (
                  sharedSessions.slice(0, 3).map((sess) => (
                    <div
                      key={`widget-share-${sess.id}`}
                      className="shared-project-item"
                      onClick={() => selectSession(sess.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="shared-project-avatar" style={{ fontSize: '13px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold' }}>
                        {sess.title ? sess.title[0].toUpperCase() : 'P'}
                      </div>
                      <div className="shared-project-info">
                        <strong>{sess.title}</strong>
                        <span>{lang === 'es' ? 'Ver circuito compartido' : 'View shared circuit'}</span>
                      </div>
                      <span className="shared-project-tag">{lang === 'es' ? 'LECTURA' : 'READ-ONLY'}</span>
                    </div>
                  ))
                ) : (
                  <div className="widget-empty-placeholder" style={{ padding: '12px 4px', fontSize: '12px', color: '#94a3b8' }}>
                    {lang === 'es' ? 'No hay proyectos compartidos contigo recientemente.' : 'No projects have been shared with you recently.'}
                  </div>
                )}
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
            {lang === 'es' ? '⬅ Volver al Historial' : '⬅ Back to History'}
          </button>
          <span className="chat-full__session-title">
            {sessions.find(s => s.id === currentSessionId)?.title || (lang === 'es' ? "Conversación" : "Conversation")}
          </span>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="chat-welcome">
          <h1 className="chat-welcome__title">
            {lang === 'es' ? '¿Qué deseas aprender hoy?' : 'What do you want to learn today?'}
          </h1>
          <div className="chat-welcome__cards">
            {getSuggestions(lang).map((s) => (
              <button
                key={s.key}
                className="chat-welcome__card"
                onClick={() => handleSuggestionClick(s)}
                disabled={isLoading}
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

          {isLoading && (
            <div className="chat-loading">
              <div className="chat-loading__dot" />
              <div className="chat-loading__dot" />
              <div className="chat-loading__dot" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  )
}
