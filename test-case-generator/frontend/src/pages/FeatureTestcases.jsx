import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addTestcase, getFeatureTestcases } from '../api/client'
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

  async function onAddTestcase(e) {
    e.preventDefault()
    if (!testcaseInput.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      await addTestcase(featureId, testcaseInput.trim())
      setTestcaseInput('')
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
      <div className="ftc-card">
        <button className="ftc-back" onClick={() => navigate('/features')}>
          ← Back to Features
        </button>

        <h1 className="ftc-title">Test Cases</h1>
        <p className="ftc-subtitle">All test cases for this feature.</p>

        <form className="ftc-form" onSubmit={onAddTestcase}>
          <input
            className="ftc-input"
            value={testcaseInput}
            onChange={(e) => setTestcaseInput(e.target.value)}
            placeholder="Enter a test case..."
            disabled={adding}
          />
          <button type="submit" className="ftc-add-btn" disabled={adding || !testcaseInput.trim()}>
            {adding ? 'Adding…' : 'Add'}
          </button>
        </form>
        {addError && <div className="ftc-error">{addError}</div>}

        {error && <div className="ftc-error">{error}</div>}

        {loading ? (
          <div className="ftc-loading">Loading…</div>
        ) : testcases.length === 0 ? (
          <div className="ftc-empty">No test cases found for this feature.</div>
        ) : (
          <ul className="ftc-list">
            {testcases.map((tc, i) => (
              <li key={tc.id ?? i} className="ftc-item">
                <div className="ftc-item-title">{tc.name ?? tc.testcase ?? `Test Case ${i + 1}`}</div>
                {tc.description && <div className="ftc-item-desc">{tc.description}</div>}
                {tc.steps && <div className="ftc-item-steps">{tc.steps}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
