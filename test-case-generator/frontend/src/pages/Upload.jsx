import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadFile } from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Upload.css'

export default function Upload() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const inputId = useId()
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  function setPickedFile(nextFile) {
    setError(null)
    setResult(null)
    setFile(nextFile)
  }

  function onPick(e) {
    setPickedFile(e.target.files?.[0] ?? null)
  }

  function onDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const dropped = e.dataTransfer?.files?.[0] ?? null
    if (dropped) setPickedFile(dropped)
  }

  function onDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  function onDragEnter(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function onDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    if (!file) {
      setError('Please choose a file.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await uploadFile(file)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h1>Upload</h1>
        <p className="upload-subtitle">Drop your file here, or browse.</p>

        <form onSubmit={onSubmit} className="upload-form">
          <label
            htmlFor={inputId}
            className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
          >
            <input
              id={inputId}
              type="file"
              onChange={onPick}
              className="dropzone-input"
            />
            <div className="dropzone-content">
              <div className="dropzone-icon" aria-hidden="true">⬆</div>
              <div className="dropzone-title">
                {file ? file.name : 'Drop your files here'}
              </div>
              <div className="dropzone-subtitle">
                {file ? `${Math.round(file.size / 1024)} KB` : 'Click to choose a file'}
              </div>
            </div>
          </label>

          <div className="upload-actions">
            <button type="submit" disabled={loading || !file} className="upload-btn">
              {loading ? 'Uploading…' : 'Upload'}
            </button>
            {file && (
              <button
                type="button"
                className="upload-btn upload-btn-secondary"
                onClick={() => setPickedFile(null)}
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {error && <div className="upload-error">{error}</div>}

        {result && (
          <div className="upload-result">
            <div className="upload-result-title">Uploaded</div>
            <pre className="upload-result-pre">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

