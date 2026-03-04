import { useAuthStore } from '../stores/auth'
import { useSessionTimeout } from './useSessionTimeout'
import config from '../config/app.config'

const API_BASE = config.api.baseUrl

export function useApi() {
  const authStore = useAuthStore()
  const { stopSessionTracking } = useSessionTimeout()

  async function api(path, { method = 'GET', body, useToken = true } = {}) {
    const headers = { 'Content-Type': 'application/json' }
    
    if (useToken && authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.api.timeout)

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const text = await res.text()
      let data
      try { data = text ? JSON.parse(text) : null } catch { data = text }

      // Hanya handle 401/403 untuk request yang memakai token
      // Untuk login (useToken = false), biarkan error dilempar
      if (useToken && (res.status === 401 || res.status === 403)) {
        stopSessionTracking()
        authStore.logout()
        window.location.replace(config.routes.adminLogin)
        throw new Error(data?.message || config.messages.sessionExpired(config.session.timeoutMinutes))
      }

      if (!res.ok) {
        const msg = data?.message || `Request gagal (${res.status})`
        throw new Error(msg)
      }

      return data
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  return { api }
}