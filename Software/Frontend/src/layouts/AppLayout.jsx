import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useChatStore from '../store/useChatStore'
import {
  MessageSquare,
  BookOpen,
  Layers,
  FolderOpen,
  FlaskConical,
  GraduationCap,
  Settings,
  User,
  HelpCircle,
  Plus,
  Trophy
} from 'lucide-react'
import './AppLayout.css'

const navItems = [
  { to: '/app/retos', label: 'Retos', icon: <Trophy size={20} /> },
  { to: '/app/library', label: 'Librería', icon: <BookOpen size={20} /> },
  { to: '/app/proyectos', label: 'Proyectos', icon: <FolderOpen size={20} /> },
  { to: '/app/components', label: 'Componentes', icon: <Layers size={20} /> },
  { to: '/app/classes', label: 'Clases', icon: <GraduationCap size={20} /> },
]

const bottomItems = [
  { to: '/app/settings', label: 'Configuraciones', icon: <Settings size={20} /> },
  { to: '/app/profile', label: 'Perfil', icon: <User size={20} /> },
  { to: '/app/help', label: 'Ayuda', icon: <HelpCircle size={20} /> },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { clearChat } = useChatStore()

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
        {/* Header: Logo + Collapse toggle */}
        <div className="sidebar__header">
          <button
            className="sidebar__logo"
            onClick={() => collapsed && setCollapsed(false)}
            title={collapsed ? 'Expandir menú' : ''}
          >
            {collapsed ? (
              <img src="/logo.svg" alt="Elektra Icon" className="sidebar__logo-icon-img" />
            ) : (
              <img src="/Elektra logo horizontal.svg" alt="Elektra Logo" className="sidebar__logo-full-img" />
            )}
          </button>

          <button
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir' : 'Minimizar'}
          >
            <span className="sidebar__collapse-arrow">
              {collapsed ? '▶' : '◀'}
            </span>
          </button>
        </div>

        {/* New Chat */}
        <button
          className="sidebar__new-chat"
          title={collapsed ? 'New Chat' : ''}
          onClick={() => {
            clearChat()
            navigate('/app/new-chat')
          }}
        >
          <span className="sidebar__new-chat-icon"><Plus size={18} /></span>
          <span className="sidebar__new-chat-text">New Chat</span>
        </button>

        {/* Nav items */}
        <nav className="sidebar__nav">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : ''}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <span className="sidebar__link-icon">{icon}</span>
              <span className="sidebar__link-text">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom items */}
        <div className="sidebar__bottom">
          {bottomItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : ''}
              className={({ isActive }) =>
                `sidebar__link sidebar__link--bottom ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <span className="sidebar__link-icon">{icon}</span>
              <span className="sidebar__link-text">{label}</span>
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}