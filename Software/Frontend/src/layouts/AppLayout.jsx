import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/app/chat', label: 'Chats' },
  { to: '/app/library', label: 'Librería' },
  { to: '/app/components', label: 'Componentes' },
  { to: '/app/projects', label: 'Projectos' },
  { to: '/app/labs', label: 'Laboratorios' },
  { to: '/app/classes', label: 'Clases' },
]

const bottomItems = [
  { to: '/app/settings', label: 'Configuraciones' },
  { to: '/app/profile', label: 'Perfil' },
  { to: '/app/help', label: 'Ayuda' },
]

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        background: '#2563EB',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        gap: '8px',
      }}>
        {/* Logo */}
        <div style={{ color: '#F59E0B', fontWeight: 800, fontSize: '22px', marginBottom: '24px' }}>
          ⚡ Elektra
        </div>

        {/* New Chat */}
        <button style={{
          background: '#F59E0B',
          border: 'none',
          borderRadius: '8px',
          padding: '10px',
          color: 'white',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '16px',
        }}>
          + New Chat
        </button>

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                color: isActive ? '#F59E0B' : 'white',
                textDecoration: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {bottomItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                color: isActive ? '#F59E0B' : 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: '#F5F0EB' }}>
        <Outlet />
      </main>
    </div>
  )
}