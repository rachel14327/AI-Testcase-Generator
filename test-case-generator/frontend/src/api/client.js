const API_BASE = 'https://salwantanya-ai-testcase-generator.hf.space'

function getToken() {
  return localStorage.getItem('access_token')
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Login failed')
  }
  return res.json()
}

export async function register(email, password, first_name, last_name) {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, first_name, last_name }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Registration failed')
  }
  return res.json()
}

export async function getProtected() {
  const token = getToken()
  const res = await fetch(`${API_BASE}/protected`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized')
    throw new Error('Request failed')
  }
  return res.json()
}

export async function uploadFile(file) {
  const token = getToken()
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${API_BASE}/api/v1/upload/upload`, {
    method: 'POST',
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

export async function getDocuments() {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/v1/upload/documents`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized')
    throw new Error('Failed to load documents')
  }
  return res.json()
}

export async function deleteDocument(documentId) {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/v1/upload/documents/${documentId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized')
    if (res.status === 404) throw new Error('Document not found')
    throw new Error('Failed to delete document')
  }
  return res.json()
}

export async function processRag(documentId) {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/v1/rag/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ document_id: documentId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'RAG processing failed')
  }
  return res.json()
}

export async function getFeatures() {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/v1/features`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized')
    throw new Error('Failed to load features')
  }
  return res.json()
}

export async function createFeature({ name, description, userId }) {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/v1/features/create-feature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      name,
      description: description ?? null,
      user_id: userId,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Create feature failed')
  }
  return res.json()
}

export async function deleteFeature(featureId) {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/v1/features/${featureId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Delete feature failed')
  }

  return res.json()
}
