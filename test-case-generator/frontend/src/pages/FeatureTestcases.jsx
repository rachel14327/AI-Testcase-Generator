import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { addTestcase, deleteTestcase, getFeatureTestcases, updateTestcaseStatus, updateTestcaseName } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './FeatureTestcases.css'

const STATUS_OPTIONS = [
  { value: 'untested', label: 'Untested', color: 'grey' },
  { value: 'passed',   label: 'Passed',   color: 'green' },
  { value: 'failed',   label: 'Failed',   color: 'red' },
  { value: 'blocked',  label: 'Blocked',  color: 'orange' },
]

export default function FeatureTestcases() {
  const { featureId } = useParams()
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [testcases, setTestcases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [testcaseInput, setTestcaseInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const dropdownRef = useRef(null)
  const editInputRef = useRef(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getFeatureTestcases(featureId)
      setTestcases(Array.isArray(data) ? data : data.test_cases ?? [])
    } catch (e) {
      setError(e.message || 'Failed to load testcases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) { navigate('/login', { replace: true, state: { from: location.pathname } }); return }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureId, token, navigate])

  useEffect(() => {
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function onAddTestcase(e) {
    e.preventDefault()
    if (!testcaseInput.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      await addTestcase(featureId, testcaseInput.trim())
      setTestcaseInput('')
      setShowForm(false)
      await load()
    } catch (e) {
      setAddError(e.message || 'Failed to add testcase')
    } finally {
      setAdding(false)
    }
  }

  async function onUpdateStatus(tcId, status) {
    setUpdatingId(tcId)
    setOpenDropdown(null)
    try {
      await updateTestcaseStatus(featureId, tcId, status)
      setTestcases(prev => prev.map(tc => tc.id === tcId ? { ...tc, status } : tc))
    } catch (e) {
      setError(e.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  function startEdit(tc) {
    setOpenDropdown(null)
    setEditingId(tc.id)
    setEditingName(tc.name ?? tc.testcase ?? '')
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName('')
  }

  async function saveEdit(tcId) {
    if (!editingName.trim()) return
    setSavingEdit(true)
    try {
      await updateTestcaseName(featureId, tcId, editingName.trim())
      setTestcases(prev => prev.map(tc => tc.id === tcId ? { ...tc, name: editingName.trim() } : tc))
      setEditingId(null)
      setEditingName('')
    } catch (e) {
      setError(e.message || 'Failed to rename testcase')
    } finally {
      setSavingEdit(false)
    }
  }

  async function onDeleteTestcase(testcaseId) {
    if (deletingId) return
    setDeletingId(testcaseId)
    try {
      await deleteTestcase(featureId, testcaseId)
      setTestcases(prev => prev.filter(tc => tc.id !== testcaseId))
    } catch (e) {
      setError(e.message || 'Failed to delete testcase')
    } finally {
      setDeletingId(null)
    }
  }

  if (!user) return null

  const total = testcases.length

  return (
    <div className="ftc-page">
      <div className="ftc-header">
        <button className="ftc-back" onClick={() => navigate('/features')}>← Features</button>
        <div className="ftc-header-right">
          <span className="ftc-count">{total} test case{total !== 1 ? 's' : ''}</span>
          <button className="ftc-add-btn" onClick={() => setShowForm(v => !v)}>+ Add Test Case</button>
        </div>
      </div>

      <div className="ftc-title-row">
        <h1 className="ftc-title">Test Cases</h1>
        <span className="ftc-feature-badge">Feature #{featureId}</span>
      </div>

      {showForm && (
        <form className="ftc-inline-form" onSubmit={onAddTestcase}>
          <input
            className="ftc-input"
            value={testcaseInput}
            onChange={e => setTestcaseInput(e.target.value)}
            placeholder="Enter test case title..."
            disabled={adding}
            autoFocus
            autoComplete="off"
          />
          <div className="ftc-form-actions">
            <button type="submit" className="ftc-submit-btn" disabled={adding || !testcaseInput.trim()}>
              {adding ? 'Adding…' : 'Add Test Case'}
            </button>
            <button type="button" className="ftc-cancel-btn" onClick={() => { setShowForm(false); setTestcaseInput('') }}>
              Cancel
            </button>
          </div>
          {addError && <div className="ftc-error">{addError}</div>}
        </form>
      )}

      {error && <div className="ftc-error">{error}</div>}

      {!loading && total > 0 && (() => {
        const counts = {
          passed:   testcases.filter(tc => (tc.status || 'untested') === 'passed').length,
          failed:   testcases.filter(tc => (tc.status || 'untested') === 'failed').length,
          blocked:  testcases.filter(tc => (tc.status || 'untested') === 'blocked').length,
          untested: testcases.filter(tc => (tc.status || 'untested') === 'untested').length,
        }
        const pct = n => Math.round((n / total) * 100)
        const segments = [
          { color: '#4ade80', count: counts.passed },
          { color: '#f87171', count: counts.failed },
          { color: '#fb923c', count: counts.blocked },
          { color: '#475569', count: counts.untested },
        ]
        let cum = 0
        const stops = segments.filter(s => s.count > 0).map(s => {
          const start = cum
          cum += (s.count / total) * 100
          return `${s.color} ${start}% ${cum}%`
        })
        return (
          <div className="ftc-stats">
            <div className="ftc-pie-wrap">
              <div className="ftc-pie" style={{ background: `conic-gradient(${stops.join(', ')})` }} />
              <div className="ftc-pie-legend">
                {[['#4ade80','Passed',counts.passed],['#f87171','Failed',counts.failed],['#fb923c','Blocked',counts.blocked],['#475569','Untested',counts.untested]].map(([color, label, count]) => (
                  <div key={label} className="ftc-legend-item">
                    <span className="ftc-legend-dot" style={{ background: color }} />
                    <span className="ftc-legend-label">{label}</span>
                    <span className="ftc-legend-pct">{pct(count)}%</span>
                    <span className="ftc-legend-count">({count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      <div className="ftc-table-wrap">
        <table className="ftc-table">
          <thead>
            <tr>
              <th className="ftc-th ftc-th-id">ID</th>
              <th className="ftc-th">Title</th>
              <th className="ftc-th ftc-th-status">Status</th>
              <th className="ftc-th ftc-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="ftc-td-empty">Loading…</td></tr>
            ) : total === 0 ? (
              <tr><td colSpan={4} className="ftc-td-empty">No test cases yet. Click "+ Add Test Case" to create one.</td></tr>
            ) : (
              testcases.map((tc) => {
                const currentStatus = tc.status || 'untested'
                const statusOpt = STATUS_OPTIONS.find(s => s.value === currentStatus) ?? STATUS_OPTIONS[0]
                const isEditing = editingId === tc.id
                return (
                  <tr key={tc.id} className="ftc-row">
                    <td className="ftc-td ftc-td-id">C{tc.id}</td>
                    <td className="ftc-td ftc-td-title">
                      {isEditing ? (
                        <div className="ftc-inline-edit">
                          <input
                            ref={editInputRef}
                            className="ftc-edit-input"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEdit(tc.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            disabled={savingEdit}
                          />
                          <button className="ftc-edit-save-btn" onClick={() => saveEdit(tc.id)} disabled={savingEdit || !editingName.trim()}>
                            {savingEdit ? '…' : 'Save'}
                          </button>
                          <button className="ftc-edit-cancel-btn" onClick={cancelEdit} disabled={savingEdit}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/features/${featureId}/testcases/${tc.id}`)}>
                          {tc.name ?? tc.testcase ?? `Test Case ${tc.id}`}
                        </span>
                      )}
                    </td>
                    <td className="ftc-td">
                      <span className={`ftc-status ftc-status-${currentStatus}`}>
                        {updatingId === tc.id ? '…' : statusOpt.label}
                      </span>
                    </td>
                    <td className="ftc-td ftc-td-actions" ref={openDropdown === tc.id ? dropdownRef : null}>
                      <div className="ftc-action-wrap">
                        <button
                          type="button"
                          className="ftc-action-btn"
                          onClick={() => setOpenDropdown(openDropdown === tc.id ? null : tc.id)}
                          disabled={updatingId === tc.id || deletingId === tc.id || isEditing}
                        >
                          Actions ▾
                        </button>
                        {openDropdown === tc.id && (
                          <div className="ftc-dropdown">
                            <div className="ftc-dropdown-section">Set status</div>
                            {STATUS_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                className={`ftc-dropdown-item ftc-dropdown-${opt.color} ${currentStatus === opt.value ? 'active' : ''}`}
                                onClick={() => onUpdateStatus(tc.id, opt.value)}
                              >
                                {opt.label}
                              </button>
                            ))}
                            <div className="ftc-dropdown-divider" />
                            <button
                              type="button"
                              className="ftc-dropdown-item ftc-dropdown-grey"
                              onClick={() => startEdit(tc)}
                            >
                              Edit name
                            </button>
                            <div className="ftc-dropdown-divider" />
                            <button
                              type="button"
                              className="ftc-dropdown-item ftc-dropdown-danger"
                              onClick={() => { setOpenDropdown(null); onDeleteTestcase(tc.id) }}
                              disabled={deletingId === tc.id}
                            >
                              {deletingId === tc.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
