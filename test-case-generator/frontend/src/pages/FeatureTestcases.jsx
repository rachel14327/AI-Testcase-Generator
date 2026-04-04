import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addTestcase, deleteTestcase, getFeatureTestcases } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './FeatureTestcases.css'

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
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureId, token, navigate])

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
        <button className="ftc-back" onClick={() => navigate('/features')}>
          ← Features
        </button>
        <div className="ftc-header-right">
          <span className="ftc-count">{testcases.length} test case{testcases.length !== 1 ? 's' : ''}</span>
          <button className="ftc-add-btn" onClick={() => setShowForm((v) => !v)}>
            + Add Test Case
          </button>
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

      <div className="ftc-table-wrap">
        <table className="ftc-table">
          <thead>
            <tr>
              <th className="ftc-th ftc-th-id">ID</th>
              <th className="ftc-th">Title</th>
              <th className="ftc-th ftc-th-status">Status</th>
              <th className="ftc-th ftc-th-actions"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="ftc-td-empty">Loading…</td>
              </tr>
            ) : testcases.length === 0 ? (
              <tr>
                <td colSpan={4} className="ftc-td-empty">No test cases yet. Click "+ Add Test Case" to create one.</td>
              </tr>
            ) : (
              testcases.map((tc, i) => (
                <tr key={tc.id ?? i} className="ftc-row">
                  <td className="ftc-td ftc-td-id">C{tc.id ?? i + 1}</td>
                  <td className="ftc-td ftc-td-title">{tc.name ?? tc.testcase ?? `Test Case ${i + 1}`}</td>
                  <td className="ftc-td">
                    <span className="ftc-status ftc-status-untested">Untested</span>
                  </td>
                  <td className="ftc-td ftc-td-actions">
                    <button
                      type="button"
                      className="ftc-delete-btn"
                      onClick={() => onDeleteTestcase(tc.id)}
                      disabled={deletingId === tc.id}
                    >
                      {deletingId === tc.id ? '…' : 'Delete'}
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
