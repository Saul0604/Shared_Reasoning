import { createBrowserRouter } from 'react-router-dom'
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

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/survey', element: <Survey /> },
  { path: '/profile-result', element: <ProfileResult /> },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <Chat /> },
      { path: 'chat', element: <Chat /> },
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
])

export default router