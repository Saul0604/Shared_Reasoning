import { useEffect } from 'react'
import useChatStore from '../store/useChatStore'
import ChatFull from '../components/chat/ChatFull'
import ChatSidebar from '../components/chat/ChatSidebar'
import VisualPanel from '../components/chat/VisualPanel'
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
      <div className="chat-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#F5F0EB' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="premium-spinner" style={{ color: '#2563eb', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>Cargando tu simulación...</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Estamos conectando con el tutor de IA y restaurando el circuito.</p>
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
