import { useState, useEffect } from 'react'
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
  Trophy,
  LogOut,
  ChevronUp
} from 'lucide-react'
import './AppLayout.css'

const navItems = [
  { to: '/app/retos', label: 'Retos', icon: <Trophy size={20} /> },
  { to: '/app/library', label: 'Librería', icon: <BookOpen size={20} /> },
  { to: '/app/proyectos', label: 'Proyectos', icon: <FolderOpen size={20} /> },
  { to: '/app/components', label: 'Componentes', icon: <Layers size={20} /> },
  { to: '/app/classes', label: 'Clases', icon: <GraduationCap size={20} /> },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  
  const { 
    clearChat, 
    goBackToHistory, 
    user, 
    loadCurrentUser 
  } = useChatStore()

  // Cargar usuario actual al montar
  useEffect(() => {
    loadCurrentUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    navigate('/')
  }

  // Generar iniciales del avatar si no hay foto
  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }

  const avatarSrc = user?.profile_picture_base64
    ? (user.profile_picture_base64.startsWith('data:') ? user.profile_picture_base64 : `data:image/jpeg;base64,${user.profile_picture_base64}`)
    : null

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
              onClick={() => {
                if (to === '/app/proyectos') {
                  goBackToHistory()
                }
              }}
            >
              <span className="sidebar__link-icon">{icon}</span>
              <span className="sidebar__link-text">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom User Area */}
        <div className="sidebar__bottom">
          {/* Menú Emergente de Usuario (Popover) */}
          {showUserMenu && (
            <div className="sidebar__user-popover">
              <button onClick={() => { navigate('/app/settings'); setShowUserMenu(false) }}>
                <Settings size={16} />
                <span>Configuraciones</span>
              </button>
              <button onClick={() => { navigate('/app/profile'); setShowUserMenu(false) }}>
                <User size={16} />
                <span>Mi Perfil</span>
              </button>
              <button onClick={() => { navigate('/app/help'); setShowUserMenu(false) }}>
                <HelpCircle size={16} />
                <span>Ayuda</span>
              </button>
              <div className="popover-divider"></div>
              <button className="popover-logout" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}

          {/* Bloque de Usuario principal */}
          <div 
            className={`sidebar__user-card ${showUserMenu ? 'active' : ''}`}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="sidebar__user-avatar" />
            ) : (
              <div className="sidebar__user-avatar-initials">
                {getInitials(user?.full_name || user?.email)}
              </div>
            )}
            {!collapsed && (
              <>
                <div className="sidebar__user-info">
                  <span className="sidebar__user-name">{user?.full_name || 'Estudiante'}</span>
                  <span className="sidebar__user-email">{user?.email || 'email@elektra.com'}</span>
                </div>
                <ChevronUp size={16} className={`sidebar__user-chevron ${showUserMenu ? 'open' : ''}`} />
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}