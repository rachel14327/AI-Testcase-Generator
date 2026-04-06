import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Features.css'

export default function Projects() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await getProjects()
      setProjects(data.projects ?? [])
    } catch (e) {
      setError(e.message || 'Failed to load projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate])

  if (!user) return null

  return (
    <div className="feat-page">
      <div className="feat-header">
        <div>
          <h1 className="feat-title">Projects</h1>
          <p className="feat-subtitle">Select a project to view its features and test cases.</p>
        </div>
      </div>

      {error && <div className="feat-error">{error}</div>}

      <div className="feat-table-wrap">
        <table className="feat-table">
          <thead>
            <tr>
              <th className="feat-th feat-th-id">ID</th>
              <th className="feat-th">Name</th>
              <th className="feat-th">Description</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="feat-td-empty">Loading…</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={3} className="feat-td-empty">No projects found.</td></tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id} className="feat-row" onClick={() => navigate(`/projects/${p.id}`)}>
                  <td className="feat-td feat-td-id">P{p.id}</td>
                  <td className="feat-td feat-td-name">{p.name}</td>
                  <td className="feat-td feat-td-desc">{p.description || <span className="feat-no-desc">—</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
