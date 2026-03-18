import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDocuments, deleteDocument } from '../api/client'
import './LeftSidebar.css'

export default function LeftSidebar() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  async function handleDelete(e, docId) {
    e.preventDefault()
    e.stopPropagation()
    if (deletingId) return
    setDeletingId(docId)
    try {
      await deleteDocument(docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    } catch {
      setDeletingId(null)
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    if (!user) {
      setDocuments([])
      return
    }
    let cancelled = false
    setLoading(true)
    getDocuments()
      .then((list) => {
        if (!cancelled) setDocuments(list)
      })
      .catch(() => {
        if (!cancelled) setDocuments([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [user])

  if (!user) return null

  return (
    <aside
      className={`left-sidebar ${expanded ? 'left-sidebar--expanded' : ''}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      aria-label="Your documents"
    >
      <div className="left-sidebar-tab">
        <span className="left-sidebar-tab-icon" aria-hidden>📄</span>
        <span className="left-sidebar-tab-label">Docs</span>
      </div>
      <div className="left-sidebar-panel">
        <div className="left-sidebar-header">Your PDFs</div>
        {loading ? (
          <div className="left-sidebar-loading">Loading…</div>
        ) : documents.length === 0 ? (
          <div className="left-sidebar-empty">
            <p>No documents yet.</p>
            <Link to="/upload" className="left-sidebar-upload-link">Upload a PDF</Link>
          </div>
        ) : (
          <ul className="left-sidebar-list">
            {documents.map((doc) => (
              <li key={doc.id} className="left-sidebar-item">
                <Link
                  to="/rag"
                  state={{ documentId: doc.id }}
                  className="left-sidebar-doc-link"
                  title={doc.file_name}
                >
                  <span className="left-sidebar-doc-icon">📄</span>
                  <span className="left-sidebar-doc-name">{doc.file_name || `Document ${doc.id}`}</span>
                </Link>
                <button
                  type="button"
                  className="left-sidebar-delete-btn"
                  onClick={(e) => handleDelete(e, doc.id)}
                  disabled={deletingId === doc.id}
                  title="Delete document"
                  aria-label={`Delete ${doc.file_name || 'document'}`}
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
