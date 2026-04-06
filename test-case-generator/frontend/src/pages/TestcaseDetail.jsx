import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTestcaseDescription, updateTestcaseDescription } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './TestcaseDetail.css'

const STATUS_COLORS = {
  passed:   { bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)',  color: '#4ade80' },
  failed:   { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', color: '#f87171' },
  blocked:  { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.35)',  color: '#fb923c' },
  untested: { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.35)', color: '#94a3b8' },
}

export default function TestcaseDetail() {
  const { featureId, testcaseId } = useParams()
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [tc, setTc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({ name: '', status: 'untested', description: '', steps: '', expected_result: '' })

  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return }
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getTestcaseDescription(featureId, testcaseId)
        setTc(data)
        setForm({
          name: data.name ?? '',
          status: data.status ?? 'untested',
          description: data.description ?? '',
          steps: data.steps ?? '',
          expected_result: data.expected_result ?? '',
        })
      } catch (e) {
        setError(e.message || 'Failed to load testcase')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [featureId, testcaseId, token, navigate])

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const updated = await updateTestcaseDescription(featureId, testcaseId, form)
      setTc(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  if (!user) return null

  const status = tc?.status || 'untested'
  const statusStyle = STATUS_COLORS[status] ?? STATUS_COLORS.untested

  return (
    <div className="tcd-page">
      <div className="tcd-breadcrumb">
        <button className="tcd-crumb" onClick={() => navigate('/features')}>Features</button>
        <span className="tcd-sep">/</span>
        <button className="tcd-crumb" onClick={() => navigate(`/features/${featureId}`)}>Test Cases</button>
        <span className="tcd-sep">/</span>
        <span className="tcd-crumb tcd-crumb-active">C{testcaseId}</span>
      </div>

      {error && <div className="tcd-error">{error}</div>}

      {loading ? (
        <div className="tcd-loading">Loading…</div>
      ) : tc && (
        <form onSubmit={onSave}>
          <div className="tcd-header">
            <div className="tcd-header-left">
              <div className="tcd-id">C{tc.id}</div>
              <input
                className="tcd-title-input"
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="Test case title"
              />
            </div>
            <div className="tcd-header-right">
              <span
                className="tcd-status-badge"
                style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.color }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <button type="submit" className="tcd-save-btn" disabled={saving}>
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>

          <div className="tcd-body">
            <div className="tcd-section">
              <label className="tcd-section-label">Description</label>
              <textarea
                className="tcd-textarea"
                value={form.description}
                onChange={(e) => onChange('description', e.target.value)}
                placeholder="Describe what this test case covers..."
                rows={3}
              />
            </div>

            <div className="tcd-section">
              <label className="tcd-section-label">Steps</label>
              <textarea
                className="tcd-textarea tcd-pre"
                value={form.steps}
                onChange={(e) => onChange('steps', e.target.value)}
                placeholder={"1. Open the login page\n2. Enter credentials\n3. Click Submit"}
                rows={5}
              />
            </div>

            <div className="tcd-section">
              <label className="tcd-section-label">Expected Result</label>
              <textarea
                className="tcd-textarea"
                value={form.expected_result}
                onChange={(e) => onChange('expected_result', e.target.value)}
                placeholder="What should happen after the steps are completed..."
                rows={3}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
