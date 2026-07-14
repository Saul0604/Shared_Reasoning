import { useEffect } from 'react'
import useChatStore from '../store/useChatStore'
import ChatFull from '../components/chat/ChatFull'
import ChatSidebar from '../components/chat/ChatSidebar'
import VisualPanel from '../components/chat/VisualPanel'
import { useTranslation } from '../utils/i18n'
import '../components/chat/Chat.css'
import { Loader2 } from 'lucide-react'

export default function Proyectos() {
  const { 
    visualMode, 
    loadSessions,
    loadSharedProjects,
    loadArchivedSessions,
    currentSessionId,
    isLoading
  } = useChatStore()
  
  const { lang } = useTranslation()

  // Configurar vista adecuada según la ruta activa al montar el componente
  useEffect(() => {
    loadSessions()
    loadSharedProjects()
    loadArchivedSessions()
    const isProjectsRoute = window.location.pathname.includes('proyectos')
    useChatStore.setState({ 
      chatViewMode: isProjectsRoute ? 'history' : 'new_chat' 
    })
  }, [window.location.pathname])

  // Ruedita de carga premium creativa
  if (isLoading) {
    return (
      <div className="chat-loading-screen">
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="premium-spinner" style={{ color: '#2563eb', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'inherit', margin: '0 0 4px 0' }}>
            {lang === 'es' ? 'Cargando tu simulación...' : 'Loading your simulation...'}
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {lang === 'es' 
              ? 'Estamos conectando con el tutor de IA y restaurando el circuito.' 
              : 'Connecting with the AI tutor and restoring the circuit.'}
          </p>
        </div>
      </div>
    )
  }

  if (visualMode && currentSessionId) {
    return (
      <div className="chat-page chat-page--visual">
        <VisualPanel />
        <ChatSidebar />
      </div>
    )
  }

  return (
    <div className="chat-page">
      <div className="chat-main-container">
        <ChatFull />
      </div>
    </div>
  )
}