// src/utils/auth.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Authenticated fetch wrapper.
 * - Attaches Bearer token automatically.
 * - Attempts one token refresh on 401.
 * - Does NOT set Content-Type for FormData (browser sets it with boundary).
 */
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('access_token')

  const buildHeaders = (tkn) => {
    const headers = { ...options.headers }
    if (tkn) headers['Authorization'] = `Bearer ${tkn}`
    // Only set Content-Type for JSON — let the browser set it for FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
    return headers
  }

  let res = await fetch(url, { ...options, headers: buildHeaders(token) })

  // Try token refresh once on 401
  if (res.status === 401) {
    const newToken = await _refreshToken()
    if (newToken) {
      res = await fetch(url, { ...options, headers: buildHeaders(newToken) })
    }
  }

  return res
}

const _refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) return null
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${refresh}` },
    })
    if (!res.ok) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return null
    }
    const data = await res.json()
    localStorage.setItem('access_token', data.access_token)
    return data.access_token
  } catch {
    return null
  }
}

/** Convenience: parse JSON and throw descriptive error on failure */
export const authFetchJson = async (url, options = {}) => {
  const res = await authFetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const adminUrl = (path) => `${API_BASE}/admin${path}`
export const authUrl  = (path) => `${API_BASE}/auth${path}`