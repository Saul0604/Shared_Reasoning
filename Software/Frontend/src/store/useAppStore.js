import { create } from 'zustand'

const useAppStore = create((set) => ({
  // Usuario
  user: null,
  userLevel: null, // 'principiante' | 'intermedio' | 'avanzado'
  setUser: (user) => set({ user }),
  setUserLevel: (level) => set({ userLevel: level }),

  // Sesión activa del laboratorio
  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),

  // Paso actual en las instrucciones
  currentStep: 0,
  totalSteps: 0,
  setCurrentStep: (step) => set({ currentStep: step }),
  setTotalSteps: (total) => set({ totalSteps: total }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
  resetSteps: () => set({ currentStep: 0, totalSteps: 0 }),

  // Chat
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}))

export default useAppStore