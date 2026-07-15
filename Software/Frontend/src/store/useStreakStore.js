import { create } from 'zustand'

const API_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token') || ''
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const useStreakStore = create((set, get) => ({
  // Streak data
  streak: {
    current_streak: 0,
    completed_today: false,
    total_completed: 0,
    total_xp: 0,
    last_completion_date: null,
  },
  streakLoading: false,
  streakError: null,

  // Load streak data from the backend
  loadStreak: async () => {
    const headers = getAuthHeaders()
    if (!headers.Authorization) return

    set({ streakLoading: true, streakError: null })
    try {
      const res = await fetch(`${API_URL}/challenges/streak`, { headers })
      if (res.ok) {
        const data = await res.json()
        set({ streak: data })
      } else {
        console.error('Error loading streak:', res.status)
      }
    } catch (err) {
      console.error('Error loading streak:', err)
      set({ streakError: err.message })
    } finally {
      set({ streakLoading: false })
    }
  },

  // Register a completed challenge and get updated streak
  completeChallenge: async (score, totalQuestions, xpEarned) => {
    const headers = getAuthHeaders()
    if (!headers.Authorization) return null

    try {
      const res = await fetch(`${API_URL}/challenges/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          score,
          total_questions: totalQuestions,
          xp_earned: xpEarned,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        set({ streak: data })
        return data
      } else if (res.status === 409) {
        // Already completed today — just reload streak
        await get().loadStreak()
        return get().streak
      } else {
        console.error('Error completing challenge:', res.status)
        return null
      }
    } catch (err) {
      console.error('Error completing challenge:', err)
      return null
    }
  },

  // Weekly progress data
  weeklyProgress: {
    items: [],
    week_start: null,
    week_end: null,
  },
  weeklyLoading: false,

  // Load weekly progress from the backend
  loadWeeklyProgress: async () => {
    const headers = getAuthHeaders()
    if (!headers.Authorization) return

    set({ weeklyLoading: true })
    try {
      const res = await fetch(`${API_URL}/challenges/weekly-progress`, { headers })
      if (res.ok) {
        const data = await res.json()
        set({ weeklyProgress: data })
      } else {
        console.error('Error loading weekly progress:', res.status)
      }
    } catch (err) {
      console.error('Error loading weekly progress:', err)
    } finally {
      set({ weeklyLoading: false })
    }
  },
}))

export default useStreakStore
