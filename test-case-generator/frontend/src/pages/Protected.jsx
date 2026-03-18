import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProtected } from '../api/client'
import './Protected.css'

export default function Protected() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    getProtected()
      .then(setData)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [token, navigate])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  if (loading) return <div className="protected-page"><div className="protected-card">Loading…</div></div>
  if (err) return <div className="protected-page"><div className="protected-card protected-error">{err}</div></div>

  return (
    <div className="protected-page">
      <div className="protected-card">
        <div className="protected-header">
          <h1>Protected</h1>
          <button type="button" onClick={handleLogout} className="logout-btn">Log out</button>
        </div>
        <p className="protected-message">{data?.message}</p>
        {data?.user && (
          <div className="user-info">
            <p><strong>User:</strong> {data.user.first_name} {data.user.last_name}</p>
            <p><strong>Email:</strong> {data.user.email}</p>
          </div>
        )}
      </div>
    </div>
  )
}
