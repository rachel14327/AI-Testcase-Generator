import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createFeature, deleteFeature, getFeatures } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Features.css'

export default function Features() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

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
      navigate('/login', { replace: true, state: { from: location.pathname } })
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Feature name is required'); return }
    setCreating(true)
    setError(null)
    try {
      await createFeature({ name: name.trim(), description: description.trim() || null, userId: user?.id })
      setName('')
      setDescription('')
      setShowForm(false)
      await load()
    } catch (e) {
      setError(e.message || 'Create feature failed')
    } finally {
      setCreating(false)
    }
  }

  async function onDeleteFeature(featureId) {
    if (deletingId) return
    const feature = items.find((f) => f.id === featureId)
    const label = feature?.name ? ` "${feature.name}"` : ''
    if (!window.confirm(`Delete${label}? This cannot be undone.`)) return
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
    <div className="feat-page">
      <div className="feat-header">
        <div>
          <h1 className="feat-title">Features</h1>
          <p className="feat-subtitle">Manage your features for test case generation.</p>
        </div>
        <button className="feat-add-btn" onClick={() => setShowForm((v) => !v)}>
          + New Feature
        </button>
      </div>

      {error && <div className="feat-error">{error}</div>}

      {showForm && (
        <form className="feat-form" onSubmit={onSubmit}>
          <h3 className="feat-form-title">New Feature</h3>
          <label className="feat-label">
            Feature name
            <input
              className="feat-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Login with email"
              disabled={creating}
              autoFocus
            />
          </label>
          <label className="feat-label">
            Description <span className="feat-optional">(optional)</span>
            <textarea
              className="feat-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description for context"
              rows={3}
              disabled={creating}
            />
          </label>
          <div className="feat-form-actions">
            <button type="submit" className="feat-submit-btn" disabled={creating}>
              {creating ? 'Creating…' : 'Create Feature'}
            </button>
            <button type="button" className="feat-cancel-btn" onClick={() => { setShowForm(false); setName(''); setDescription('') }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="feat-table-wrap">
        <table className="feat-table">
          <thead>
            <tr>
              <th className="feat-th feat-th-id">ID</th>
              <th className="feat-th">Name</th>
              <th className="feat-th">Description</th>
              <th className="feat-th feat-th-actions"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="feat-td-empty">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="feat-td-empty">No features yet. Click "+ New Feature" to create one.</td></tr>
            ) : (
              items.map((f) => (
                <tr key={f.id} className="feat-row" onClick={() => navigate(`/features/${f.id}`, { state: { featureName: f.name } })}>
                  <td className="feat-td feat-td-id">F{f.id}</td>
                  <td className="feat-td feat-td-name">{f.name}</td>
                  <td className="feat-td feat-td-desc">{f.description || <span className="feat-no-desc">—</span>}</td>
                  <td className="feat-td feat-td-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="feat-delete-btn"
                      onClick={() => onDeleteFeature(f.id)}
                      disabled={deletingId === f.id}
                    >
                      {deletingId === f.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
