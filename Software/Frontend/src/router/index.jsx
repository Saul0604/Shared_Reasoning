import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Landing from '../pages/Landing'
import Survey from '../pages/Survey'
import ProfileResult from '../pages/ProfileResult'
import Chat from '../pages/Chats'
import Library from '../pages/Library'
import Components from '../pages/Components'
import Projects from '../pages/Projects'
import Labs from '../pages/Labs'
import Classes from '../pages/Classes'
import Settings from '../pages/Settings'
import Profile from '../pages/Profile'
import Help from '../pages/Help'

// Guardián para proteger rutas privadas
function ProtectedRoute() {
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    // Redirigir a Landing si no hay sesión
    return <Navigate to="/" replace />
  }
  
  return <Outlet />
}

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/survey', element: <Survey /> },
  { path: '/profile-result', element: <ProfileResult /> },
  {
    path: '/app',
    element: <ProtectedRoute />, // Envolver con el protector
    children: [
      {
        element: <AppLayout />, // Renderiza la barra de navegación dentro del protector
        children: [
          { index: true, element: <Navigate to="chats" replace /> },
          { path: 'chats', element: <Chat /> },
          { path: 'new-chat', element: <Chat /> },
          { path: 'library', element: <Library /> },
          { path: 'components', element: <Components /> },
          { path: 'projects', element: <Projects /> },
          { path: 'labs', element: <Labs /> },
          { path: 'classes', element: <Classes /> },
          { path: 'settings', element: <Settings /> },
          { path: 'profile', element: <Profile /> },
          { path: 'help', element: <Help /> },
        ]
      }
    ]
  }
])

export default router