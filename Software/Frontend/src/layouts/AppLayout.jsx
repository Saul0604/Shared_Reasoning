import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import './AppLayout.css'

const navItems = [
  { to: '/app/chat', label: 'Chats', icon: '💬' },
  { to: '/app/library', label: 'Librería', icon: '💡' },
  { to: '/app/components', label: 'Componentes', icon: '📋' },
  { to: '/app/projects', label: 'Projectos', icon: '📁' },
  { to: '/app/labs', label: 'Laboratorios', icon: '🔬' },
  { to: '/app/classes', label: 'Clases', icon: '🎓' },
]

const bottomItems = [
  { to: '/app/settings', label: 'Configuraciones', icon: '⚙️' },
  { to: '/app/profile', label: 'Perfil', icon: '👤' },
  { to: '/app/help', label: 'Ayuda', icon: '❓' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

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
            <span className="sidebar__logo-icon">⚡</span>
            <span className="sidebar__logo-text">Elektra</span>
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
        <button className="sidebar__new-chat" title={collapsed ? 'New Chat' : ''}>
          <span className="sidebar__new-chat-icon">＋</span>
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