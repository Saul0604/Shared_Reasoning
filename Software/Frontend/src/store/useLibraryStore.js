import { create } from 'zustand'

const API_URL = 'http://localhost:8000'

const useLibraryStore = create((set, get) => ({
  materials: [],
  isLoading: false,
  error: null,

  fetchMaterials: async (category = null, difficulty = null) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('access_token')
      let url = `${API_URL}/library`
      const params = new URLSearchParams()
      if (category && category !== 'Todos') params.append('category', category)
      if (difficulty && difficulty !== 'Todos') params.append('difficulty', difficulty)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Error al cargar materiales')
      const data = await res.json()
      set({ materials: data })
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  uploadMaterial: async (formData) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${API_URL}/library/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Error al subir material')
      }
      const newMaterial = await res.json()
      set(state => ({ materials: [newMaterial, ...state.materials] }))
      return newMaterial
    } catch (err) {
      set({ error: err.message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },
  
  downloadMaterialAsBlob: async (id, filename) => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${API_URL}/library/download/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Error al descargar')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'document.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (err) {
      set({ error: err.message })
      alert(err.message)
    } finally {
      set({ isLoading: false })
    }
  }
}))

export default useLibraryStore
