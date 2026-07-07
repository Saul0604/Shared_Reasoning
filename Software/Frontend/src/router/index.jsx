import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Landing from '../pages/Landing'
import Survey from '../pages/Survey'
import ProfileResult from '../pages/ProfileResult'
import Proyectos from '../pages/Proyectos'
import Library from '../pages/Library'
import Components from '../pages/Components'
import Retos from '../pages/Retos'
import Classes from '../pages/Classes'
import Settings from '../pages/Settings'
import Profile from '../pages/Profile'
import Help from '../pages/Help'
import ShareResolver from '../pages/ShareResolver'

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
          { index: true, element: <Navigate to="proyectos" replace /> },
          { path: 'proyectos', element: <Proyectos /> },
          { path: 'proyectos/share/:token', element: <ShareResolver /> },
          { path: 'new-chat', element: <Proyectos /> },
          { path: 'library', element: <Library /> },
          { path: 'components', element: <Components /> },
          { path: 'retos', element: <Retos /> },
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