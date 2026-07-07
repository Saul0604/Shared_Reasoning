import { create } from 'zustand'

const API_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

// Obtiene los headers de autorización si existe token
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || ''
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const useChatStore = create((set, get) => ({
  // Sessions
  sessions: [],
  currentSessionId: null,

  // Messages
  messages: [],
  isLoading: false,

  // Visual mode
  visualMode: false,
  chatPanelCollapsed: false,
  chatViewMode: 'history', // 'new_chat' | 'history'

  // Circuit / extract data
  extractResult: null,       // Full result from /extract (project, circuit, steps)
  currentStep: 0,
  schemaPreviewUrl: null,    // URL of the uploaded schema image
  extractLoading: false,

  // AI Provider selection
  selectedProvider: 'gemini', // 'gemini' | 'openai' | 'local'

  // Actions
  toggleChatPanel: () => set((s) => ({ chatPanelCollapsed: !s.chatPanelCollapsed })),
  setChatPanelCollapsed: (v) => set({ chatPanelCollapsed: v }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setProvider: (provider) => set({ selectedProvider: provider }),

  // Carga todas las sesiones de chat del usuario autenticado
  loadSessions: async () => {
    try {
      const headers = getAuthHeaders()
      if (!headers.Authorization) return
      
      const res = await fetch(`${API_URL}/chat/sessions`, { headers })
      if (res.ok) {
        const data = await res.json()
        set({ sessions: data })
      }
    } catch (err) {
      console.error('Error loading sessions:', err)
    }
  },

  // Selecciona un chat y carga su historial de mensajes
  selectSession: async (sessionId) => {
    set({ currentSessionId: sessionId, isLoading: true, chatViewMode: 'history' })
    try {
      const headers = getAuthHeaders()
      
      // Buscar la sesión actual para restaurar su imagen esquema
      const activeSession = get().sessions.find(s => s.id === sessionId)
      let imagePreview = null
      if (activeSession && activeSession.schema_image_base64) {
        imagePreview = activeSession.schema_image_base64.startsWith('data:')
          ? activeSession.schema_image_base64
          : `data:image/jpeg;base64,${activeSession.schema_image_base64}`
      }

      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, { headers })
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

      const res = await fetch(`${API_URL}/chat/sessions`, {
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
      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}/favorite`, {
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
      const res = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers
      })

      if (res.ok) {
        set((s) => ({
          sessions: s.sessions.filter(sess => sess.id !== sessionId),
          currentSessionId: s.currentSessionId === sessionId ? null : s.currentSessionId,
          chatViewMode: 'history'
        }))
        if (get().currentSessionId === null) {
          get().clearChat()
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err)
    }
  },

  clearChat: () => set({
    messages: [],
    visualMode: false,
    extractResult: null,
    currentStep: 0,
    schemaPreviewUrl: null,
    chatPanelCollapsed: false,
    extractLoading: false,
    currentSessionId: null,
    chatViewMode: 'new_chat'
  }),

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
      const extractUrl = provider ? `${API_URL}/extract?provider=${provider}` : `${API_URL}/extract`
      const extractRes = await fetch(extractUrl, {
        method: 'POST',
        body: formData,
      })

      if (!extractRes.ok) {
        throw new Error('No se pudo analizar el esquema.')
      }

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

      const chatRes = await fetch(chatEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(chatPayload),
      })

      let reply = '✅ He analizado tu diagrama. Puedes ver la protoboard generada en el panel visual.'
      if (chatRes.ok) {
        const chatData = await chatRes.json()
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
    set({ messages: [...messages, userMsg], isLoading: true })

    // Build history for the API
    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const chatEndpoint = sessionId 
        ? `${API_URL}/chat/sessions/${sessionId}/message`
        : `${API_URL}/chat`

      const res = await fetch(chatEndpoint, {
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
        }),
      })

      if (!res.ok) throw new Error('Error en la respuesta del servidor')

      const data = await res.json()
      const assistantMsg = { role: 'assistant', content: data.reply, timestamp: Date.now() }

      set({
        messages: [...get().messages, assistantMsg],
        isLoading: false,
      })

      // Recargar las sesiones para actualizar títulos autogenerados
      if (sessionId) {
        get().loadSessions()
      }
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = {
        role: 'assistant',
        content: '⚠️ Hubo un error al conectar con el servidor. Intenta de nuevo.',
        timestamp: Date.now(),
      }
      set({ messages: [...get().messages, errorMsg], isLoading: false })
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
      
      const res = await fetch(`${API_URL}/auth/me`, { headers })
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
      
      const res = await fetch(`${API_URL}/auth/profile`, {
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
  }
}))

export default useChatStore
