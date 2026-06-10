// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  return response.json()
}

// ── Articles API ─────────────────────────────────────────────────────────────
export const articlesApi = {
  getAll: async (page = 1, perPage = 10, category = null) => {
    const params = new URLSearchParams({ page, per_page: perPage })
    if (category) params.append('category', category)
    const response = await fetch(`${API_BASE_URL}/articles?${params}`)
    return handleResponse(response)
  },

  getLatest: async (limit = 5) => {
    const response = await fetch(`${API_BASE_URL}/articles/latest?limit=${limit}`)
    return handleResponse(response)
  },

  getCurrentIssue: async () => {
    const response = await fetch(`${API_BASE_URL}/articles/current-issue`)
    return handleResponse(response)
  },

  getInProgress: async () => {
    const response = await fetch(`${API_BASE_URL}/articles/in-progress`)
    return handleResponse(response)
  },

  getArticle: async (id) => {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`)
    return handleResponse(response)
  },

  search: async (query, page = 1) => {
    const params = new URLSearchParams({ q: query, page, per_page: 10 })
    const response = await fetch(`${API_BASE_URL}/articles/search?${params}`)
    return handleResponse(response)
  },

  incrementDownload: async (id) => {
    const response = await fetch(`${API_BASE_URL}/articles/${id}/download`, {
      method: 'POST',
    })
    return handleResponse(response)
  },
}

// ── Volumes API ───────────────────────────────────────────────────────────────
export const volumesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/volumes`)
    return handleResponse(response)
  },

  getIssueArticles: async (volumeNumber, issueNumber) => {
    const response = await fetch(`${API_BASE_URL}/volumes/${volumeNumber}/issues/${issueNumber}`)
    return handleResponse(response)
  },
}

// ── Editorial Board API ───────────────────────────────────────────────────────
export const editorialApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/editorial-board`)
    return handleResponse(response)
  },
}

// ── Manuscripts API ───────────────────────────────────────────────────────────
export const manuscriptsApi = {
  submit: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/manuscripts/submit`, {
      method: 'POST',
      body: formData,
    })
    return handleResponse(response)
  },

  track: async (email, manuscriptNumber = '') => {
    const params = new URLSearchParams({ email })
    if (manuscriptNumber) params.append('manuscript_number', manuscriptNumber)
    const response = await fetch(`${API_BASE_URL}/manuscripts/track?${params}`)
    return handleResponse(response)
  },
}

// ── Contact API ───────────────────────────────────────────────────────────────
export const contactApi = {
  send: async (data) => {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },
}

// ── Join API ──────────────────────────────────────────────────────────────────
export const joinApi = {
  applyReviewer: async (data) => {
    const response = await fetch(`${API_BASE_URL}/join/reviewer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  applyEditorial: async (data) => {
    const response = await fetch(`${API_BASE_URL}/join/editorial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },
}

// ── Certificate API ───────────────────────────────────────────────────────────
export const certificateApi = {
  getCertificate: async (manuscriptNumber, email) => {
    const params = new URLSearchParams({ manuscript_number: manuscriptNumber, email })
    const response = await fetch(`${API_BASE_URL}/certificate?${params}`)
    return handleResponse(response)
  },

  downloadCertificate: async (manuscriptNumber, email) => {
    const params = new URLSearchParams({ manuscript_number: manuscriptNumber, email })
    const response = await fetch(`${API_BASE_URL}/certificate/download?${params}`)
    if (!response.ok) throw new Error('Download failed')
    return response.blob()
  },
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return handleResponse(response)
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return handleResponse(response)
  },

  resetPassword: async (token, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    return handleResponse(response)
  },
}