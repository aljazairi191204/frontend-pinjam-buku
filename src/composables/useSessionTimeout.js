import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import config from '../config/app.config'

const SESSION_TIMEOUT_MS = config.session.timeoutMs
const SESSION_TIMEOUT_MINUTES = config.session.timeoutMinutes

export function useSessionTimeout() {
  const authStore = useAuthStore()
  const sessionTimeoutTimer = ref(null)

  function resetSessionTimer() {
    if (!authStore.token) return

    if (sessionTimeoutTimer.value) {
      clearTimeout(sessionTimeoutTimer.value)
      sessionTimeoutTimer.value = null
    }

    sessionTimeoutTimer.value = setTimeout(() => {
      autoLogout()
    }, SESSION_TIMEOUT_MS)

    localStorage.setItem('last_activity', Date.now().toString())
  }

  function autoLogout() {
    if (authStore.token) {
      alert(config.messages.sessionExpired(SESSION_TIMEOUT_MINUTES))
      authStore.logout()
      window.location.replace(config.routes.adminLogin)
    }
  }

  function initSessionTracking() {
    const events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'click', 'touchstart']
    
    events.forEach(eventName => {
      window.addEventListener(eventName, resetSessionTimer, { passive: true })
    })

    const lastActivity = localStorage.getItem('last_activity')
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity)
      const remaining = SESSION_TIMEOUT_MS - elapsed
      
      if (remaining > 0) {
        sessionTimeoutTimer.value = setTimeout(autoLogout, remaining)
      } else {
        autoLogout()
      }
    } else {
      resetSessionTimer()
    }
  }

  function stopSessionTracking() {
    if (sessionTimeoutTimer.value) {
      clearTimeout(sessionTimeoutTimer.value)
      sessionTimeoutTimer.value = null
    }
    localStorage.removeItem('last_activity')

    const events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'click', 'touchstart']
    events.forEach(eventName => {
      window.removeEventListener(eventName, resetSessionTimer)
    })
  }

  return {
    initSessionTracking,
    stopSessionTracking,
    resetSessionTimer,
    autoLogout
  }
}