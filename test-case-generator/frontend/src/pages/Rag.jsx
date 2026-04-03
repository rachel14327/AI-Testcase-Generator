import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getDocuments, processRag } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Rag.css'

export default function Rag() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [documents, setDocuments] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [featureName, setFeatureName] = useState('')
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    let cancelled = false
    getDocuments()
      .then((list) => {
        if (!cancelled) {
          setDocuments(list)
          const fromState = location.state?.documentId
          const idToSelect = (fromState != null && list.some((d) => d.id === fromState))
            ? String(fromState)
            : list.length ? String(list[0].id) : ''
          setSelectedId(idToSelect)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load documents')
      })
      .finally(() => {
        if (!cancelled) setLoadingDocs(false)
      })
    return () => { cancelled = true }
  }, [token, navigate, location.state?.documentId])

  async function handleProcess(e) {
    e.preventDefault()
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    const id = selectedId ? parseInt(selectedId, 10) : null
    if (!id) {
      setError('Select a document first.')
      return
    }
    setProcessing(true)
    setError(null)
    setResult(null)
    try {
      const data = await processRag(id, featureName.trim())
      setResult(data)
    } catch (err) {
      setError(err.message || 'RAG processing failed')
    } finally {
      setProcessing(false)
    }
  }

  if (!user) return null

  return (
    <div className="rag-page">
      <div className="rag-card">
        <h1>Generate test cases</h1>
        <p className="rag-subtitle">
          Pick an uploaded PDF and run the RAG pipeline to get a summary, impact analysis, and test cases.
        </p>

        <form onSubmit={handleProcess} className="rag-form">
          <label className="rag-label">
            Document
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loadingDocs || processing}
              className="rag-select"
            >
              <option value="">— Select —</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.file_name || `Document ${d.id}`}
                </option>
              ))}
            </select>
          </label>

          <label className="rag-label">
            Feature name
            <input
              className="rag-input"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              placeholder="e.g. Login with email"
              disabled={processing}
            />
          </label>

          <div className="rag-actions">
            <button
              type="submit"
              disabled={loadingDocs || processing || !selectedId}
              className="rag-btn rag-btn-primary"
            >
              {processing ? 'Processing…' : 'Generate test cases'}
            </button>
          </div>
        </form>

        {error && <div className="rag-error">{error}</div>}

        {result && (
          <div className="rag-result">
            <h2 className="rag-result-title">{result.filename}</h2>

            <section className="rag-section">
              <h3>Summary</h3>
              <p className="rag-text">{result.summary}</p>
            </section>

            <section className="rag-section">
              <h3>Impact</h3>
              {result.impact?.has_impact ? (
                <ul className="rag-impact-list">
                  {(result.impact.impacts || []).map((i, idx) => (
                    <li key={idx}>
                      <strong>{i.feature_name}</strong>: {i.reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rag-text">No impact on previous features.</p>
              )}
            </section>

            <section className="rag-section">
              <h3>Test cases</h3>
              <pre className="rag-pre">{result.test_cases}</pre>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
