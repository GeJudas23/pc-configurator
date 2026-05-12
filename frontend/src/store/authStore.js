import { create } from 'zustand'
import client from '../api/client'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('access_token') || null,

  login: async (credentials) => {
    const { data } = await client.post('/auth/login/', credentials)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    set({ user: data.user, token: data.access })
    return data.user
  },

  register: async (credentials) => {
    const { data } = await client.post('/auth/register/', credentials)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    set({ user: data.user, token: data.access })
    return data.user
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
