import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addTestcase, deleteTestcase, getFeatureTestcases, updateTestcaseStatus } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './FeatureTestcases.css'

const STATUS_OPTIONS = [
  { value: 'untested',  label: 'Untested',  color: 'grey' },
  { value: 'passed',    label: 'Passed',    color: 'green' },
  { value: 'failed',    label: 'Failed',    color: 'red' },
  { value: 'blocked',   label: 'Blocked',   color: 'orange' },
]

export default function FeatureTestcases() {
  const { featureId } = useParams()
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [testcases, setTestcases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [testcaseInput, setTestcaseInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const dropdownRef = useRef(null)

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
    if (!token) { navigate('/login', { replace: true }); return }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureId, token, navigate])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function onUpdateStatus(tcId, status) {
    setUpdatingId(tcId)
    setOpenDropdown(null)
    try {
      await updateTestcaseStatus(featureId, tcId, status)
      setTestcases((prev) => prev.map((tc) => tc.id === tcId ? { ...tc, status } : tc))
    } catch (e) {
      setError(e.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  async function onDeleteTestcase(testcaseId) {
    if (deletingId) return
    setDeletingId(testcaseId)
    try {
      await deleteTestcase(featureId, testcaseId)
      setTestcases((prev) => prev.filter((tc) => tc.id !== testcaseId))
    } catch (e) {
      setError(e.message || 'Failed to delete testcase')
    } finally {
      setDeletingId(null)
    }
  }

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

  if (!user) return null

  return (
    <div className="ftc-page">
      <div className="ftc-header">
        <button className="ftc-back" onClick={() => navigate('/features')}>← Features</button>
        <div className="ftc-header-right">
          <span className="ftc-count">{testcases.length} test case{testcases.length !== 1 ? 's' : ''}</span>
          <button className="ftc-add-btn" onClick={() => setShowForm((v) => !v)}>+ Add Test Case</button>
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
            onChange={(e) => setTestcaseInput(e.target.value)}
            placeholder="Enter test case title..."
            disabled={adding}
            autoFocus
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

      {!loading && testcases.length > 0 && (() => {
        const total = testcases.length
        const counts = {
          passed:   testcases.filter(tc => (tc.status || 'untested') === 'passed').length,
          failed:   testcases.filter(tc => (tc.status || 'untested') === 'failed').length,
          blocked:  testcases.filter(tc => (tc.status || 'untested') === 'blocked').length,
          untested: testcases.filter(tc => (tc.status || 'untested') === 'untested').length,
        }
        const pct = (n) => Math.round((n / total) * 100)

        // Build conic-gradient stops
        const segments = [
          { color: '#4ade80', count: counts.passed },
          { color: '#f87171', count: counts.failed },
          { color: '#fb923c', count: counts.blocked },
          { color: '#475569', count: counts.untested },
        ]
        let cumulative = 0
        const stops = segments
          .filter(s => s.count > 0)
          .map(s => {
            const start = cumulative
            cumulative += (s.count / total) * 100
            return `${s.color} ${start}% ${cumulative}%`
          })
        const gradient = `conic-gradient(${stops.join(', ')})`

        return (
          <div className="ftc-stats">
            <div className="ftc-pie-wrap">
              <div className="ftc-pie" style={{ background: gradient }} />
              <div className="ftc-pie-legend">
                <div className="ftc-legend-item">
                  <span className="ftc-legend-dot" style={{ background: '#4ade80' }} />
                  <span className="ftc-legend-label">Passed</span>
                  <span className="ftc-legend-pct">{pct(counts.passed)}%</span>
                  <span className="ftc-legend-count">({counts.passed})</span>
                </div>
                <div className="ftc-legend-item">
                  <span className="ftc-legend-dot" style={{ background: '#f87171' }} />
                  <span className="ftc-legend-label">Failed</span>
                  <span className="ftc-legend-pct">{pct(counts.failed)}%</span>
                  <span className="ftc-legend-count">({counts.failed})</span>
                </div>
                <div className="ftc-legend-item">
                  <span className="ftc-legend-dot" style={{ background: '#fb923c' }} />
                  <span className="ftc-legend-label">Blocked</span>
                  <span className="ftc-legend-pct">{pct(counts.blocked)}%</span>
                  <span className="ftc-legend-count">({counts.blocked})</span>
                </div>
                <div className="ftc-legend-item">
                  <span className="ftc-legend-dot" style={{ background: '#475569' }} />
                  <span className="ftc-legend-label">Untested</span>
                  <span className="ftc-legend-pct">{pct(counts.untested)}%</span>
                  <span className="ftc-legend-count">({counts.untested})</span>
                </div>
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
            ) : testcases.length === 0 ? (
              <tr><td colSpan={4} className="ftc-td-empty">No test cases yet. Click "+ Add Test Case" to create one.</td></tr>
            ) : (
              testcases.map((tc, i) => {
                const currentStatus = tc.status || 'untested'
                const statusOpt = STATUS_OPTIONS.find((s) => s.value === currentStatus) ?? STATUS_OPTIONS[0]
                return (
                  <tr key={tc.id ?? i} className="ftc-row">
                    <td className="ftc-td ftc-td-id">C{tc.id ?? i + 1}</td>
                    <td className="ftc-td ftc-td-title" style={{ cursor: 'pointer' }} onClick={() => navigate(`/features/${featureId}/testcases/${tc.id}`)}>{tc.name ?? tc.testcase ?? `Test Case ${i + 1}`}</td>
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
                          disabled={updatingId === tc.id || deletingId === tc.id}
                        >
                          Actions ▾
                        </button>
                        {openDropdown === tc.id && (
                          <div className="ftc-dropdown">
                            <div className="ftc-dropdown-section">Set status</div>
                            {STATUS_OPTIONS.map((opt) => (
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
