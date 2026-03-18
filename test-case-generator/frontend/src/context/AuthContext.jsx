import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  const loadUser = useCallback(async () => {
    if (!token) return
    try {
      const data = await api.getProtected()
      setUser(data.user ?? null)
    } catch {
      setToken(null)
      localStorage.removeItem('access_token')
      setUser(null)
    }
  }, [token])

  useEffect(() => {
    if (token) loadUser()
    else setUser(null)
  }, [token, loadUser])

  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const data = await api.login(email, password)
      localStorage.setItem('access_token', data.access_token)
      setToken(data.access_token)
      const protectedData = await api.getProtected()
      setUser(protectedData.user ?? null)
      return data
    } catch (e) {
      setError(e.message)
      throw e
    }
  }, [])

  const register = useCallback(async (email, password, first_name, last_name) => {
    setError(null)
    try {
      const data = await api.register(email, password, first_name, last_name)
      return data
    } catch (e) {
      setError(e.message)
      throw e
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
