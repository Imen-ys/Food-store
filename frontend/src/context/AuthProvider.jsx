import { useEffect, useState } from 'react'
import api from '../api/client'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Ask the server once: "who am I?" (the browser sends the cookie)
  useEffect(() => {
    const controller = new AbortController()

    async function loadUser() {
      try {
        const { data } = await api.get('/auth/me', { signal: controller.signal })
        setUser(data)
      } catch (err) {
        if (err.code === 'ERR_CANCELED') return
        setUser(null) // 401 = not logged in, which is normal
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadUser()
    return () => controller.abort()
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    setUser(data)
    return data
  }

  async function register(payload) {
    await api.post('/auth/register', payload)
    return login(payload.email, payload.password)
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }

  const value = { user, loading, login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}