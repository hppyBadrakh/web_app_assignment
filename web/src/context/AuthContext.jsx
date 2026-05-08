import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  // хуудас ачаалах үед localStorage-аас session сэргээнэ
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (!savedToken) { setLoading(false); return }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${savedToken}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) { setToken(savedToken); setUser(data.user) }
        else localStorage.removeItem('auth_token')
      })
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setLoading(false))
  }, [])

  function login(newToken, newUser) {
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  async function logout() {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }

  // Authorization header-г автоматаар нэмдэг fetch wrapper
  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
