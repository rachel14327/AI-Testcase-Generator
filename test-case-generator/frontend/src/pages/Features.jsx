import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createFeature, deleteFeature, getFeatures } from '../api/client'

import { useAuth } from '../context/AuthContext'
import './Features.css'

export default function Features() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const list = await getFeatures()
      setItems(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e.message || 'Failed to load features')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    if (!name.trim()) {
      setError('Feature name is required')
      return
    }
    setCreating(true)
    setError(null)
    try {
      await createFeature({
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        userId: user?.id,
      })
      setName('')
      setDescription('')
      await load()
    } catch (e) {
      setError(e.message || 'Create feature failed')
    } finally {
      setCreating(false)
    }
  }

  async function onDeleteFeature(featureId) {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    if (deletingId) return
    const feature = items.find((f) => f.id === featureId)
    const label = feature?.name ? ` "${feature.name}"` : ''
    const ok = window.confirm(`Delete this feature${label}? This will remove it from the database.`)
    if (!ok) return

    setDeletingId(featureId)
    setError(null)
    try {
      await deleteFeature(featureId)
      setItems((prev) => prev.filter((f) => f.id !== featureId))
    } catch (e) {
      setError(e.message || 'Delete feature failed')
    } finally {
      setDeletingId(null)
    }
  }

  if (!user) return null

  return (
    <div className="features-page">
      <div className="features-card">
        <h1>Features</h1>
        <p className="features-subtitle">Manage your features for test case generation.</p>

        {error && <div className="features-error">{error}</div>}

        <form className="features-form" onSubmit={onSubmit}>
          <label className="features-label">
            Feature name
            <input
              className="features-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Login with email"
              disabled={creating}
            />
          </label>

          <label className="features-label">
            Description (optional)
            <textarea
              className="features-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description for context"
              rows={3}
              disabled={creating}
            />
          </label>

          <div className="features-actions">
            <button type="submit" className="features-btn features-btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create feature'}
            </button>
          </div>
        </form>

        <div className="features-list">
          {loading ? (
            <div className="features-loading">Loading…</div>
          ) : items.length === 0 ? (
            <div className="features-empty">No features yet.</div>
          ) : (
            <ul className="features-ul">
              {items.map((f) => (
                <li key={f.id} className="features-li" onClick={() => navigate(`/features/${f.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="features-li-main">
                    <div className="features-li-title">{f.name}</div>
                    {f.description && <div className="features-li-desc">{f.description}</div>}
                  </div>
                  <button
                    type="button"
                    className="features-delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDeleteFeature(f.id) }}
                    disabled={deletingId === f.id}
                  >
                    {deletingId === f.id ? 'Deleting…' : 'Delete'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

