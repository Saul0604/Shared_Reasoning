import { create } from 'zustand'
import { apiFetch } from '../utils/apiFetch'

const API_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')

// Obtiene los headers de autorización si existe token
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || ''
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
  
  // Optional user-provided custom API keys from settings
  const geminiKey = localStorage.getItem('user_gemini_api_key')
  const openaiKey = localStorage.getItem('user_openai_api_key')
  
  if (geminiKey) headers['X-Gemini-API-Key'] = geminiKey
  if (openaiKey) headers['X-OpenAI-API-Key'] = openaiKey
  
  return headers
}

const useChatStore = create((set, get) => ({
  // Sessions
  sessions: [],
  archivedSessions: [],
  currentSessionId: null,

  // Messages
  messages: [],
  isLoading: false,
  isChatTyping: false,
  dashboardLoading: false,

  // Visual mode
  visualMode: false,
  chatPanelCollapsed: false,
  stepsPanelCollapsed: false,
  stepRenderMode: 'highlight', // 'highlight' | 'progressive'
  chatViewMode: 'history', // 'new_chat' | 'history'

  // Circuit / extract data
  extractResult: null,       // Full result from /extract (project, circuit, steps)
  currentStep: 0,
  schemaPreviewUrl: null,    // URL of the uploaded schema image
  extractLoading: false,

  // AI Provider selection
  selectedProvider: localStorage.getItem('selected_provider') || 'gemini', // 'gemini' | 'openai' | 'local'

  // UI Preferences (i18n & theme)
  language: localStorage.getItem('user_language') || 'es',
  darkMode: localStorage.getItem('dark_mode') === 'true',

  // Actions
  toggleChatPanel: () => set((s) => ({ chatPanelCollapsed: !s.chatPanelCollapsed })),
  setChatPanelCollapsed: (v) => set({ chatPanelCollapsed: v }),
  toggleStepsPanel: () => set((s) => ({ stepsPanelCollapsed: !s.stepsPanelCollapsed })),
  setStepsPanelCollapsed: (v) => set({ stepsPanelCollapsed: v }),
  setStepRenderMode: (mode) => set({ stepRenderMode: mode }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setProvider: (provider) => {
    localStorage.setItem('selected_provider', provider)
    set({ selectedProvider: provider })
  },
  setLanguage: (lang) => {
    localStorage.setItem('user_language', lang)
    set({ language: lang })
  },
  setDarkMode: (bool) => {
    localStorage.setItem('dark_mode', bool)
    set({ darkMode: bool })
  },

  // Carga todas las sesiones de chat del usuario autenticado
  loadSessions: async () => {
    const sessionsEmpty = get().sessions.length === 0
    if (sessionsEmpty) {
      set({ dashboardLoading: true })
    }
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) return
      
      const res = await apiFetch(`${API_URL}/chat/sessions`, { headers })
      if (res.ok) {
        const data = await res.json()
        set({ sessions: data })
      }
    } catch (err) {
      console.error('Error loading sessions:', err)
    } finally {
      set({ dashboardLoading: false })
    }
  },

  // Selecciona un chat y carga su historial de mensajes
  selectSession: async (sessionId) => {
    set({ currentSessionId: sessionId, isLoading: true, chatViewMode: 'history' })
    try {
      const headers = getAuthHeaders()
      
      // Buscar la sesión actual para restaurar su imagen esquema
      const activeSession = get().sessions.find(s => s.id === sessionId) || get().sharedSessions.find(s => s.id === sessionId)
      let imagePreview = null
      if (activeSession && activeSession.schema_image_base64) {
        imagePreview = activeSession.schema_image_base64.startsWith('data:')
          ? activeSession.schema_image_base64
          : `data:image/jpeg;base64,${activeSession.schema_image_base64}`
      }

      const res = await apiFetch(`${API_URL}/chat/sessions/${sessionId}/messages`, { headers })
      if (res.ok) {
        const data = await res.json()
        
        // Mapear el historial cargado al formato interno
        const mappedMessages = data.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp).getTime()
        }))

        // Si el último mensaje contiene contexto de proyecto guardado en json, lo restauramos
        let lastProjectContext = null
        const lastMsgWithCtx = [...data].reverse().find(m => m.project_context_json)
        if (lastMsgWithCtx) {
          try {
            lastProjectContext = JSON.parse(lastMsgWithCtx.project_context_json)
          } catch(e) {
            console.error('Error parsing project context:', e)
          }
        }

        set({
          messages: mappedMessages,
          extractResult: lastProjectContext ? { project: lastProjectContext } : null,
          visualMode: lastProjectContext ? true : false,
          currentStep: lastMsgWithCtx?.current_step || 0,
          schemaPreviewUrl: imagePreview
        })
      }
    } catch (err) {
      console.error('Error selecting session:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  // Crea una nueva sesión vacía
  createNewSession: async (title = "Nuevo Circuito", schemaImageBase64 = null) => {
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) {
        // Fallback local si no hay login
        get().clearChat()
        return
      }

      const res = await apiFetch(`${API_URL}/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ 
          title,
          schema_image_base64: schemaImageBase64
        })
      })

      if (res.ok) {
        const newSession = await res.json()
        set((s) => ({
          sessions: [newSession, ...s.sessions],
          currentSessionId: newSession.id,
          messages: [],
          extractResult: null,
          visualMode: false,
          currentStep: 0,
          schemaPreviewUrl: schemaImageBase64 
            ? (schemaImageBase64.startsWith('data:') ? schemaImageBase64 : `data:image/jpeg;base64,${schemaImageBase64}`)
            : null,
          chatViewMode: 'history'
        }))
        return newSession.id
      }
    } catch (err) {
      console.error('Error creating session:', err)
    }
  },

  // Alternar favorito de un proyecto/sesión
  toggleFavorite: async (sessionId) => {
    try {
      const headers = getAuthHeaders()
      const res = await apiFetch(`${API_URL}/chat/sessions/${sessionId}/favorite`, {
        method: 'PATCH',
        headers
      })

      if (res.ok) {
        const updatedSession = await res.json()
        set((s) => ({
          sessions: s.sessions.map(sess => sess.id === sessionId ? updatedSession : sess)
        }))
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  },

  // Elimina una sesión
  deleteSession: async (sessionId) => {
    try {
      const headers = getAuthHeaders()
      const res = await apiFetch(`${API_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers
      })

      if (res.ok) {
        set((s) => ({
          sessions: s.sessions.filter(sess => sess.id !== sessionId),
          currentSessionId: s.currentSessionId === sessionId ? null : s.currentSessionId,
        }))
        if (get().currentSessionId === null) {
          get().clearChat(true) // preserve view mode so we don't jump to 'new_chat'
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err)
    }
  },

  clearChat: (preserveView = false) => set((s) => ({
    messages: [],
    visualMode: false,
    extractResult: null,
    currentStep: 0,
    schemaPreviewUrl: null,
    chatPanelCollapsed: false,
    extractLoading: false,
    currentSessionId: null,
    chatViewMode: preserveView ? s.chatViewMode : 'new_chat'
  })),

  goBackToHistory: () => set({
    messages: [],
    visualMode: false,
    extractResult: null,
    currentStep: 0,
    schemaPreviewUrl: null,
    currentSessionId: null,
    chatViewMode: 'history'
  }),

  // Extract circuit from an image via /extract endpoint
  extractFromImage: async (file) => {
    set({ extractLoading: true })

    // Convertir archivo a Base64 para guardarlo en la base de datos
    const fileToBase64 = (f) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(f)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })

    let base64Image = null
    try {
      base64Image = await fileToBase64(file)
      set({ schemaPreviewUrl: base64Image })
    } catch (e) {
      console.error("Error converting file to base64:", e)
      const previewUrl = URL.createObjectURL(file)
      set({ schemaPreviewUrl: previewUrl })
    }

    // Asegurarse de tener una sesión activa antes de enviar el mensaje
    let sessionId = get().currentSessionId
    const headers = getAuthHeaders()
    if (headers.Authorization && !sessionId) {
      sessionId = await get().createNewSession(file.name, base64Image)
    }

    // Add user message with image context
    const userMsg = {
      role: 'user',
      content: `📐 He subido un diagrama: ${file.name}. Analiza y convierte a protoboard.`,
      timestamp: Date.now(),
      hasImage: true,
      imageName: file.name,
    }
    set((s) => ({ messages: [...s.messages, userMsg] }))

    try {
      // 1. Send to /extract
      const formData = new FormData()
      formData.append('file', file)
      const provider = get().selectedProvider
      const skillLevel = get().user?.skill_level || 'Principiante'
      const extractUrl = provider 
        ? `${API_URL}/extract?provider=${provider}&skill_level=${skillLevel}` 
        : `${API_URL}/extract?skill_level=${skillLevel}`
      const extractRes = await apiFetch(extractUrl, {
        method: 'POST',
        headers: {
          ...headers
        },
        body: formData,
      })

      const extractData = await extractRes.json()

      // 2. Also send to chat so the AI explains
      const history = get().messages.map(m => ({ role: m.role, content: m.content }))
      const chatPayload = {
        message: 'He subido un diagrama de circuito. Analiza los componentes y explícame paso a paso cómo armarlo en la protoboard.',
        history,
        project_context: extractData?.project || null,
        provider: get().selectedProvider,
      }

      const chatEndpoint = sessionId 
        ? `${API_URL}/chat/sessions/${sessionId}/message`
        : `${API_URL}/chat`

      const chatRes = await apiFetch(chatEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(chatPayload),
      })

      let reply = '✅ He analizado tu diagrama. Puedes ver la protoboard generada en el panel visual.'
      const chatData = await chatRes.json()
      if (chatData && chatData.reply) {
         reply = chatData.reply
      }

      const assistantMsg = { role: 'assistant', content: reply, timestamp: Date.now() }

      set({
        messages: [...get().messages, assistantMsg],
        extractResult: extractData,
        visualMode: true,
        currentStep: 0,
        extractLoading: false,
        isLoading: false,
      })
      
      // Recargar las sesiones para actualizar títulos autogenerados
      if (sessionId) {
        get().loadSessions()
      }
    } catch (err) {
      console.error('Extract error:', err)
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ ${err.message || 'Error al analizar el esquema. Intenta de nuevo.'}`,
        timestamp: Date.now(),
      }
      set({
        messages: [...get().messages, errorMsg],
        extractLoading: false,
        isLoading: false,
      })
    }
  },

  // Send text message to /chat
  sendMessage: async (text, imageFile) => {
    // If there's an image, go through the extract flow
    if (imageFile) {
      return get().extractFromImage(imageFile)
    }

    const { messages, extractResult, currentSessionId } = get()
    const headers = getAuthHeaders()

    // Asegurarse de tener una sesión activa antes de enviar el mensaje
    let sessionId = currentSessionId
    if (headers.Authorization && !sessionId) {
      sessionId = await get().createNewSession()
    }

    // Add user message
    const userMsg = { role: 'user', content: text, timestamp: Date.now() }
    set({ messages: [...messages, userMsg], isChatTyping: true })

    // Build history for the API
    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const chatEndpoint = sessionId 
        ? `${API_URL}/chat/sessions/${sessionId}/message`
        : `${API_URL}/chat`

      const res = await apiFetch(chatEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          message: text,
          history,
          project_context: extractResult?.project || null,
          current_step: extractResult ? get().currentStep : null,
          provider: get().selectedProvider,
          skill_level: get().user?.skill_level || null,
        }),
      })

      const data = await res.json()
      const assistantMsg = { role: 'assistant', content: data.reply, timestamp: Date.now() }

      set({
        messages: [...get().messages, assistantMsg],
        isChatTyping: false,
      })

      // Recargar las sesiones para actualizar títulos autogenerados
      if (sessionId) {
        get().loadSessions()
      }
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ ${err.message || 'Hubo un error al conectar con el servidor. Intenta de nuevo.'}`,
        timestamp: Date.now(),
      }
      set({ messages: [...get().messages, errorMsg], isChatTyping: false })
    }
  },

  // Suggestion that requires an image — returns true to signal the caller to open file picker
  needsImage: (suggestionKey) => {
    return ['explain-circuit', 'convert-protoboard'].includes(suggestionKey)
  },

  // User Authentication State
  user: null,

  loadCurrentUser: async () => {
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) return
      
      const res = await apiFetch(`${API_URL}/auth/me`, { headers })
      if (res.ok) {
        const userData = await res.json()
        set({ user: userData })
      }
    } catch (err) {
      console.error('Error loading current user:', err)
    }
  },

  updateProfile: async (fullName, profilePictureBase64) => {
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) return
      
      const res = await apiFetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          full_name: fullName,
          profile_picture_base64: profilePictureBase64
        })
      })

      if (res.ok) {
        const updatedUser = await res.json()
        set({ user: updatedUser })
        return updatedUser
      }
    } catch (err) {
      console.error('Error updating profile:', err)
    }
  },

  // Compartidos state
  sharedSessions: [],

  loadSharedProjects: async () => {
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) return
      
      const res = await apiFetch(`${API_URL}/share/received`, { headers })
      if (res.ok) {
        const data = await res.json()
        set({ sharedSessions: data })
      }
    } catch (err) {
      console.error('Error loading shared projects:', err)
    }
  },

  generateShareLink: async (chatId) => {
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) return null
      
      const res = await apiFetch(`${API_URL}/share/sessions/${chatId}`, {
        method: 'POST',
        headers
      })
      if (res.ok) {
        const token = await res.json()
        // Retornar la URL de compartir local
        const frontendUrl = window.location.origin
        return `${frontendUrl}/app/proyectos/share/${token}`
      }
    } catch (err) {
      console.error('Error generating share link:', err)
    }
    return null
  },

  claimSharedProject: async (token) => {
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) return null
      
      const res = await apiFetch(`${API_URL}/share/resolve/${token}`, {
        method: 'POST',
        headers
      })
      if (res.ok) {
        const project = await res.json()
        // Recargar las sesiones del usuario para que incluya la nueva sesión recibida
        await get().loadSessions()
        await get().loadSharedProjects()
        return project
      }
    } catch (err) {
      console.error('Error claiming shared project:', err)
    }
    return null
  },

  renameSession: async (chatId, newTitle) => {
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) return false
      
      const res = await apiFetch(`${API_URL}/chat/sessions/${chatId}/title`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ title: newTitle })
      })
      if (res.ok) {
        const updated = await res.json()
        
        // Actualizar localmente en sessions
        const updatedSessions = get().sessions.map(s => 
          s.id === chatId ? { ...s, title: updated.title } : s
        )
        set({ sessions: updatedSessions })
        return true
      }
    } catch (err) {
      console.error('Error renaming session:', err)
    }
    return false
  },

  loadArchivedSessions: async () => {
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) return
      
      const res = await apiFetch(`${API_URL}/chat/sessions?include_archived=true`, { headers })
      if (res.ok) {
        const data = await res.json()
        set({ archivedSessions: data })
      }
    } catch (err) {
      console.error('Error loading archived sessions:', err)
    }
  },

  toggleArchiveSession: async (chatId) => {
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) return false
      
      const res = await apiFetch(`${API_URL}/chat/sessions/${chatId}/archive`, {
        method: 'PATCH',
        headers
      })
      if (res.ok) {
        // Recargar ambas listas
        await get().loadSessions()
        await get().loadArchivedSessions()
        return true
      }
    } catch (err) {
      console.error('Error archiving session:', err)
    }
    return false
  }
}))

export default useChatStore
