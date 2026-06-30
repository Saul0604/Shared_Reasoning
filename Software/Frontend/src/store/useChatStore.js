import { create } from 'zustand'

const API_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

const useChatStore = create((set, get) => ({
  // Messages
  messages: [],
  isLoading: false,

  // Visual mode
  visualMode: false,
  chatPanelCollapsed: false,

  // Circuit / extract data
  extractResult: null,       // Full result from /extract (project, circuit, steps)
  currentStep: 0,
  schemaPreviewUrl: null,    // URL of the uploaded schema image
  extractLoading: false,

  // Actions
  toggleChatPanel: () => set((s) => ({ chatPanelCollapsed: !s.chatPanelCollapsed })),
  setChatPanelCollapsed: (v) => set({ chatPanelCollapsed: v }),
  setCurrentStep: (step) => set({ currentStep: step }),

  clearChat: () => set({
    messages: [],
    visualMode: false,
    extractResult: null,
    currentStep: 0,
    schemaPreviewUrl: null,
    chatPanelCollapsed: false,
    extractLoading: false,
  }),

  // Extract circuit from an image via /extract endpoint
  extractFromImage: async (file) => {
    set({ extractLoading: true })

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    set({ schemaPreviewUrl: previewUrl })

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
      const extractRes = await fetch(`${API_URL}/extract`, {
        method: 'POST',
        body: formData,
      })

      if (!extractRes.ok) {
        throw new Error('No se pudo analizar el esquema.')
      }

      const extractData = await extractRes.json()

      // 2. Also send to chat so the AI explains
      const history = get().messages.map(m => ({ role: m.role, content: m.content }))
      const chatRes = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'He subido un diagrama de circuito. Analiza los componentes y explícame paso a paso cómo armarlo en la protoboard.',
          history,
          project_context: extractData?.project || null,
        }),
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

    const { messages, extractResult } = get()

    // Add user message
    const userMsg = { role: 'user', content: text, timestamp: Date.now() }
    set({ messages: [...messages, userMsg], isLoading: true })

    // Build history for the API
    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          project_context: extractResult?.project || null,
          current_step: extractResult ? get().currentStep : null,
        }),
      })

      if (!res.ok) throw new Error('Error en la respuesta del servidor')

      const data = await res.json()
      const assistantMsg = { role: 'assistant', content: data.reply, timestamp: Date.now() }

      set({
        messages: [...get().messages, assistantMsg],
        isLoading: false,
      })
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
}))

export default useChatStore
