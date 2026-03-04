<template>
  <div>
    <Header brand-link="/" brand-text="Edukarya Library" :nav-links="navLinks" />
    
    <main class="container wrap">
      <!-- Banner Container - DILUAR FORM -->
      <div class="banner-wrapper" v-if="banner.show">
        <section class="hero hero-message" :class="banner.type">
          <h1 style="font-size:18px; margin:0 0 6px">{{ banner.title }}</h1>
          <p style="margin:0">{{ banner.message }}</p>
        </section>
      </div>

      <section class="card">
        <div class="card-header">
          <h1 class="card-title" style="font-size:22px">Login Admin</h1>
          <p class="card-subtitle">
            Masuk untuk mengelola buku & melihat riwayat peminjaman.
          </p>
        </div>

        <div class="card-body">
          <!-- Form dengan @submit.prevent untuk mencegah refresh -->
          <form class="form" @submit.prevent="handleLogin">
            <div class="field">
              <label for="username">Username</label>
              <input 
                id="username" 
                v-model="form.username" 
                type="text"
                placeholder="Masukkan username" 
                required 
              />
            </div>

            <div class="field">
              <label for="password">Password</label>
              <input 
                id="password" 
                v-model="form.password" 
                type="password" 
                placeholder="Masukkan password" 
                required 
              />
            </div>

            <div class="row-actions" style="margin-top: 8px">
              <button 
                class="btn primary" 
                type="submit" 
                :disabled="loading"
              >
                {{ loading ? 'Memproses...' : 'Login' }}
              </button>
              <button 
                class="btn danger" 
                type="button" 
                @click="resetForm"
                :disabled="loading"
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../components/Header.vue'
import { useApi } from '../composables/useApi'
import { useAuthStore } from '../stores/auth'
import { useSessionTimeout } from '../composables/useSessionTimeout'

const router = useRouter()
const { api } = useApi()
const authStore = useAuthStore()
const { stopSessionTracking } = useSessionTimeout()

const navLinks = [
  { to: '/', text: 'Publik' }
]

// Form state
const form = reactive({
  username: '',
  password: ''
})

const loading = ref(false)

// Banner state - TERPISAH DARI FORM
const banner = reactive({
  show: false,
  type: '',
  title: '',
  message: ''
})

// Timer untuk banner
let bannerTimer = null

onMounted(() => {
  stopSessionTracking()
  localStorage.removeItem('last_activity')
})

// Reset form WITHOUT refreshing page
function resetForm() {
  form.username = ''
  form.password = ''
  // Banner TIDAK ikut direset
}

// Hapus banner
function hideBanner() {
  if (bannerTimer) {
    clearTimeout(bannerTimer)
    bannerTimer = null
  }
  banner.show = false
}

// Tampilkan banner
function showBanner(type, title, message) {
  // Hapus banner sebelumnya jika ada
  hideBanner()
  
  // Tampilkan banner baru
  banner.show = true
  banner.type = type === 'success' ? 'ok' : 'late'
  banner.title = title
  banner.message = message
  
  // Set timer untuk menghilangkan banner setelah 5 detik
  bannerTimer = setTimeout(() => {
    banner.show = false
    bannerTimer = null
  }, 5000)
}

async function handleLogin() {
  // Validasi input
  if (!form.username.trim() || !form.password.trim()) {
    showBanner('error', 'Error', 'Username dan password wajib diisi.')
    return
  }

  loading.value = true
  
  try {
    const res = await api('/auth/login', { 
      method: 'POST', 
      useToken: false,
      body: { 
        username: form.username.trim(), 
        password: form.password 
      } 
    })
    
    // Login sukses
    authStore.setAuth(res)
    localStorage.setItem('last_activity', Date.now().toString())
    
    showBanner('success', 'Berhasil', 'Login berhasil. Mengalihkan ke dashboard…')
    
    // Reset form setelah login sukses (opsional, karena akan redirect)
    resetForm()
    
    // Redirect setelah 1.5 detik
    setTimeout(() => {
      router.push('/admin/dashboard')
    }, 1500)
    
  } catch (err) {
    // Login gagal - tampilkan error di banner
    showBanner('error', 'Gagal', err.message)
    
    // RESET FORM OTOMATIS setelah login gagal (seperti menekan tombol reset)
    resetForm()
    
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.wrap {
  min-height: calc(100vh - 68px);
  display: grid;
  place-items: center;
  padding: 18px 0;
}

/* Banner wrapper - di luar card */
.banner-wrapper {
  width: 100%;
  max-width: 520px;
  margin-bottom: 16px;
}

.card {
  width: 100%;
  max-width: 520px;
}

.row-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

/* Style untuk banner */
.hero.hero-message {
  margin-top: 0;
  padding: 16px 20px;
  box-shadow: var(--shadow);
  border-radius: 20px;
  border: 1px solid rgba(226,232,240,.9);
}

.hero.hero-message.ok {
  background: rgba(34,197,94,.14);
  border-color: rgba(34,197,94,.35);
}

.hero.hero-message.late {
  background: rgba(239,68,68,.14);
  border-color: rgba(239,68,68,.35);
}

.hero.hero-message h1 {
  font-size: 16px;
  margin: 0 0 4px 0;
}

.hero.hero-message p {
  font-size: 14px;
  margin: 0;
}
</style>