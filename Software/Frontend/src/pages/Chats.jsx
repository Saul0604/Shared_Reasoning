import useChatStore from '../store/useChatStore'
import ChatFull from '../components/chat/ChatFull'
import ChatSidebar from '../components/chat/ChatSidebar'
import VisualPanel from '../components/chat/VisualPanel'
import '../components/chat/Chat.css'

export default function Chats() {
  const { visualMode } = useChatStore()

  if (visualMode) {
    return (
      <div className="chat-page chat-page--visual">
        <VisualPanel />
        <ChatSidebar />
      </div>
    )
  }

  return (
    <div className="chat-page">
      <ChatFull />
    </div>
  )
}