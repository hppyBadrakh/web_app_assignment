import { createContext, useContext, useState, useEffect } from 'react'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [adminUser,  setAdminUser]  = useState(null)
  const [adminToken, setAdminToken] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('admin_token')
    if (!saved) { setLoading(false); return }

    fetch('/api/admin/me', { headers: { Authorization: `Bearer ${saved}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) { setAdminToken(saved); setAdminUser(data.user) }
        else localStorage.removeItem('admin_token')
      })
      .catch(() => localStorage.removeItem('admin_token'))
      .finally(() => setLoading(false))
  }, [])

  function adminLogin(token, user) {
    localStorage.setItem('admin_token', token)
    setAdminToken(token)
    setAdminUser(user)
  }

  async function adminLogout() {
    if (adminToken) {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {})
    }
    localStorage.removeItem('admin_token')
    setAdminToken(null)
    setAdminUser(null)
  }

  function adminFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: adminToken ? `Bearer ${adminToken}` : '',
      },
    })
  }

  return (
    <AdminAuthContext.Provider value={{ adminUser, adminToken, loading, adminLogin, adminLogout, adminFetch }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
