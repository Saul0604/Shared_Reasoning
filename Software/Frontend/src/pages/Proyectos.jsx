import { useEffect } from 'react'
import useChatStore from '../store/useChatStore'
import ChatFull from '../components/chat/ChatFull'
import ChatSidebar from '../components/chat/ChatSidebar'
import VisualPanel from '../components/chat/VisualPanel'
import '../components/chat/Chat.css'

export default function Proyectos() {
  const { 
    visualMode, 
    loadSessions,
    currentSessionId
  } = useChatStore()

  // Configurar vista adecuada según la ruta activa al montar el componente
  useEffect(() => {
    loadSessions()
    const isProjectsRoute = window.location.pathname.includes('proyectos')
    useChatStore.setState({ 
      chatViewMode: isProjectsRoute ? 'history' : 'new_chat' 
    })
  }, [window.location.pathname])

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
