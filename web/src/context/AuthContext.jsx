import { createContext, useContext, useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// AuthContext  —  нэвтэрсэн хэрэглэгчийн мэдээллийг бүх аппликейшнтай хуваалцдаг
// ─────────────────────────────────────────────────────────────────────────────
//
// React Context нь компонентын модоор дамжуулж өгөгдөл дамжуулах арга бөгөөд
// түвшин бүрт prop дамжуулах шаардлагагүй.
//
// Бид гурван зүйлийг хадгална:
//   user    — нэвтэрсэн хэрэглэгчийн объект (нэвтрээгүй бол null)
//   token   — сессийн токений мөр (нэвтрээгүй бол null)
//   loading — хуудас анх ачаалах үед localStorage шалгаж байгаа хугацаанд true байна
//
const AuthContext = createContext(null)

// ─────────────────────────────────────────────────────────────────────────────
// AuthProvider  —  бүх аппликейшнийг ороож auth төлвийг нийлүүлдэг
// ─────────────────────────────────────────────────────────────────────────────
//
// App.jsx дотор хэрэглэх арга:
//   <AuthProvider>
//     <Navbar />
//     <Routes>...</Routes>
//   </AuthProvider>
//
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true) // нэвтрэх хуудсыг анивчихаас сэргийлэхийн тулд true-гаас эхэлнэ

  // ── Анхны ачаалалт: localStorage-аас сессийг сэргээнэ ───────────────────
  // Хэрэглэгч хуудсаа дахин ачаалах үед өмнө нэвтэрсэн эсэхийг шалгана.
  // Токеныг localStorage-д хадгалдаг тул хуудас дахин ачаалагдсаны дараа ч хадгалагдана.
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')

    if (!savedToken) {
      // Токен хадгалагдаагүй — хэрэглэгч нэвтрээгүй байна
      setLoading(false)
      return
    }

    // Токен байна, гэхдээ серверт хүчинтэй эсэхийг шалгах хэрэгтэй.
    // (Хугацаа дуусч эсвэл өөр tab дээр гарснаар устгагдсан байж болно.)
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          // Токен хүчинтэй байна — сессийг сэргээнэ
          setToken(savedToken)
          setUser(data.user)
        } else {
          // Токен хугацаа дууссан эсвэл хүчингүй — устгана
          localStorage.removeItem('auth_token')
        }
      })
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setLoading(false))
  }, [])

  // ── login(token, user) ─────────────────────────────────────────────────────
  // /api/auth/login эсвэл /api/auth/signup амжилттай болсны дараа дуудна.
  // Токеныг localStorage-д хадгалдаг тул хуудас дахин ачаалагдсаны дараа ч хадгалагдана.
  function login(newToken, newUser) {
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  // ── logout() ───────────────────────────────────────────────────────────────
  // Серверт сессийг устгахыг хэлж, дараа нь локал төлвийг цэвэрлэнэ.
  async function logout() {
    if (token) {
      // Серверт токеныг хүчингүй болгохыг хэлнэ
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}) // сүлжээний алдааг үл тоомсорло — бид ямар ч тохиолдолд локалаас цэвэрлэнэ
    }
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }

  // ── authFetch(url, options) ────────────────────────────────────────────────
  // `fetch`-ийн бүрхүүл бөгөөд Authorization header-г автоматаар нэмдэг.
  // Хамгаалагдсан API endpoint дуудах бүрт ашиглаарай.
  //
  // Жишээ:
  //   const res = await authFetch('/api/exams', { method: 'POST', body: ... })
  //
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

  const value = { user, token, loading, login, logout, authFetch }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// useAuth()  —  компонент бүр auth төлвийг авахад ашигладаг hook
// ─────────────────────────────────────────────────────────────────────────────
//
// Дурын компонент дотор хэрэглэх арга:
//   const { user, logout, authFetch } = useAuth()
//
export function useAuth() {
  return useContext(AuthContext)
}
