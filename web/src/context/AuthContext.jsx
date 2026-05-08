import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  //useState - uurchlugddug huvisagch
  const [user, setUser] = useState(null) // log in hiisen user-uuding hadgalna
  const [token, setToken] = useState(null) // auth token hadgalna
  const [loading, setLoading] = useState(true) // auth status shalgaj baigaa esehiig hadgalna

  // page unshih uyd localStorage-aas session sergeene
  //component load duussanii daraa ajillana
  // localStorage(browser storage)-d hadgalsan token baigaa esehiig shalgana
  // token baival /api/auth/me-ruu request yavuulj token bat esehiig shalgana
  // token-gui baival localStorage-s ustgana
  //loading duussanii daraa loading state-g false bolgono
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

  //user log in hiisnii daraa duudnа
  // token-g localStorage-d hadgalnа, state update hiine
  function login(newToken, newUser) {
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  //token baival server-ruu logout request yavuulna, localStorage-s token ustgana, state update hiine (null)
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

  // Authorization header-g automatar nemdeg helper function
  //token baival "Authorization: Bearer" nemne, user data-g fetch geh met authenticated request uuded ashiglana
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

//ymarch component AuthContext-d access hiihdee useAuth hook-g duudna
export function useAuth() {
  return useContext(AuthContext)
}
