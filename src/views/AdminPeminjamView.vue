<template>
  <div>
    <Header 
      brand-link="/admin/dashboard" 
      brand-text="Admin Edukarya Library"
      :show-user="true"
      :show-logout="true"
      :nav-links="navLinks"
      @logout="handleLogout"
    />
    
    <main class="container">
      <section class="hero">
        <h1>Kelola Peminjam</h1>
        <p>CRUD data peminjam. Peminjam hanya memiliki ID dan Nama.</p>
      </section>

      <section class="shell">
        <section class="card">
          <div class="tabs" style="justify-content:space-between; align-items:center">
            <div style="display:flex; gap:8px; align-items:center">
              <span class="badge">Daftar Peminjam</span>
            </div>
            <div class="top-actions">
              <button class="btn primary" @click="openPeminjamModal('create')">+ Tambah Peminjam</button>
            </div>
          </div>

          <div class="pane" style="padding:16px">
            <div class="search-section">
              <div class="toolbar">
                <div class="search-box">
                  <span class="search-icon">🔍</span>
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Cari peminjam berdasarkan nama atau ID..."
                    class="search-input"
                    :class="{ 'fuzzy-active': isFuzzySearch }"
                    @input="handleSearchInput"
                  />
                  <button 
                    v-if="searchQuery" 
                    class="search-clear" 
                    @click="clearSearch"
                    title="Hapus pencarian"
                  >
                    ✕
                  </button>
                  <span v-if="isFuzzySearch" class="fuzzy-badge" title="Pencarian fuzzy aktif (toleransi typo)">
                    🔄 Fuzzy
                  </span>
                </div>

                <div class="toolbar-actions">
                  <button 
                    class="btn" 
                    :class="{ 'primary': fuzzyMode }"
                    @click="toggleFuzzyMode"
                    :title="fuzzyMode ? 'Fuzzy search aktif' : 'Fuzzy search nonaktif'"
                  >
                    <span class="sort-icon">🔎</span>
                    {{ fuzzyMode ? 'Pencarian Optimal: ON' : 'Pencarian Optimal: OFF' }}
                  </button>
                </div>
              </div>

              <div class="search-stats" v-if="filteredPeminjamList.length > 0 || searchQuery">
                <div class="stats-left">
                  <span class="badge" :class="{ 'primary': isFuzzySearch }">
                    👥 {{ filteredPeminjamList.length }} peminjam ditemukan
                  </span>
                  <span v-if="searchQuery" class="badge muted">
                    🔍 Pencarian: "{{ searchQuery }}"
                  </span>
                  <span v-if="isFuzzySearch && searchQuery" class="badge" style="background: #fef9c3; color: #854d0e;">
                    🔄 Fuzzy match aktif
                  </span>
                </div>
                <div class="stats-right helper">
                  Menampilkan {{ paginatedPeminjamList.length }} peminjam • 
                  Halaman {{ currentPage }} dari {{ totalPages }}
                </div>
              </div>

              <div v-if="fuzzySuggestions.length > 0" class="fuzzy-suggestions">
                <span class="helper">Mungkin maksud Anda:</span>
                <button 
                  v-for="suggestion in fuzzySuggestions" 
                  :key="suggestion"
                  class="btn suggestion-chip"
                  @click="searchQuery = suggestion"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>

            <div class="table-wrap" style="margin-top:10px">
              <table id="peminjam_table">
                <thead>
                  <tr>
                    <th>ID Peminjam</th>
                    <th>Nama Peminjam</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="3">Memuat…</td>
                  </tr>
                  <tr v-else-if="paginatedPeminjamList.length === 0">
                    <td colspan="3">
                      <div class="empty-search-message">
                        {{ searchQuery ? `Tidak ada peminjam yang cocok dengan "${searchQuery}"` : 'Belum ada peminjam.' }}
                      </div>
                    </td>
                  </tr>
                  <tr v-for="p in paginatedPeminjamList" :key="p.id_peminjam">
                    <td>{{ p.id_peminjam }}</td>
                    <td>{{ p.nama_peminjam }}</td>
                    <td>
                      <button class="btn" @click="editPeminjam(p)">Edit</button>
                      <button class="btn danger" @click="confirmDeletePeminjam(p)">Hapus</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PAGINATION -->
            <div v-if="filteredPeminjamList.length > itemsPerPage" class="pagination-container">
              <div class="pagination">
                <button 
                  class="btn pagination-btn" 
                  :disabled="currentPage === 1"
                  @click="goToPage(1)"
                  title="Halaman pertama"
                >
                  ⟪
                </button>
                <button 
                  class="btn pagination-btn" 
                  :disabled="currentPage === 1"
                  @click="prevPage"
                >
                  ←
                </button>

                <template v-for="page in displayedPages" :key="page">
                  <button 
                    v-if="page !== '...'"
                    class="btn pagination-btn" 
                    :class="{ 'active primary': currentPage === page }"
                    @click="goToPage(page)"
                  >
                    {{ page }}
                  </button>
                  <span v-else class="pagination-ellipsis">...</span>
                </template>

                <button 
                  class="btn pagination-btn" 
                  :disabled="currentPage === totalPages"
                  @click="nextPage"
                >
                  →
                </button>
                <button 
                  class="btn pagination-btn" 
                  :disabled="currentPage === totalPages"
                  @click="goToPage(totalPages)"
                  title="Halaman terakhir"
                >
                  ⟫
                </button>
              </div>

              <div class="pagination-go-to">
                <span class="helper">Lompat ke</span>
                <input 
                  type="number" 
                  v-model.number="gotoPageInput" 
                  min="1" 
                  :max="totalPages"
                  @keyup.enter="goToGotoPage"
                  class="pagination-input"
                  placeholder="No"
                />
                <button class="btn" @click="goToGotoPage">Go</button>
              </div>
            </div>

            <div v-if="filteredPeminjamList.length > 0" class="items-per-page">
              <span class="helper">Tampilkan per halaman:</span>
              <select v-model="itemsPerPage" @change="handleItemsPerPageChange" class="items-per-page-select">
                <option v-for="option in uiConfig.itemsPerPage" :key="option" :value="option">
                  {{ option }} peminjam
                </option>
              </select>
            </div>

            <p class="helper" style="margin-top:10px">
              * ID peminjam dibuat otomatis oleh sistem.
            </p>
          </div>
        </section>
      </section>

      <footer class="footer">
        <div class="helper">Copyright © 2026 Edukarya Ecosystem</div>
      </footer>
    </main>

    <PeminjamModal
      :show="showModal"
      :mode="modalMode"
      :title="modalTitle"
      :initial="selectedPeminjam"
      @close="closePeminjamModal"
      @success="onPeminjamSuccess"
    />

    <!-- Confirm Delete Modal untuk Peminjam -->
    <div class="modal-backdrop" :class="{ show: showConfirmDeleteModal }" @click.self="closeConfirmDeleteModal">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3 class="modal-title">Konfirmasi Hapus</h3>
          <button class="btn close-btn" type="button" @click="closeConfirmDeleteModal">Tutup</button>
        </div>
        <div class="modal-body">
          <div class="helper" style="margin-bottom:12px">
            Apakah anda yakin akan menghapus peminjam <strong>{{ selectedDeletePeminjam?.nama_peminjam }}</strong> dengan ID <strong>{{ selectedDeletePeminjam?.id_peminjam }}</strong>?
          </div>

          <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap">
            <button class="btn cancel-btn" type="button" @click="closeConfirmDeleteModal">Batal</button>
            <button class="btn danger" type="button" @click="deletePeminjam" :disabled="deleteLoading">Ya, Hapus</button>
          </div>
        </div>
      </div>
    </div>

    <AlertModal
      :show="showAlertModal"
      :type="alertType"
      :title="alertTitle"
      :message="alertMessage"
      :button-type="alertType === 'error' ? 'danger' : 'success'"
      @close="closeAlert"
      @confirm="closeAlert"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../components/Header.vue'
import PeminjamModal from '../components/PeminjamModal.vue'
import AlertModal from '../components/AlertModal.vue'
import { useApi } from '../composables/useApi'
import { useAuthStore } from '../stores/auth'
import { useSessionTimeout } from '../composables/useSessionTimeout'
import { useSearch } from '../composables/useSearch'
import config from '../config/app.config'

const router = useRouter()
const { api } = useApi()
const authStore = useAuthStore()
const { initSessionTracking } = useSessionTimeout()
const { 
  normalizeText, 
  textContainsFuzzy,
  similarityScore
} = useSearch()

const uiConfig = config.ui

const navLinks = [
  { to: '/admin/dashboard', text: 'Dashboard' },
  { to: '/', text: 'Publik' }
]

const loading = ref(true)
const peminjamList = ref([])

// State untuk pencarian
const searchQuery = ref('')
const fuzzyMode = ref(config.search.fuzzyModeDefault)
const searchTimeout = ref(null)

// State untuk pagination
const currentPage = ref(1)
const itemsPerPage = ref(config.ui.defaultItemsPerPage)
const gotoPageInput = ref('')

const showAlertModal = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')
const alertType = ref('success')

const showModal = ref(false)
const modalMode = ref('create')
const modalTitle = ref('Tambah Peminjam')
const selectedPeminjam = ref(null)

// State untuk confirm delete peminjam
const showConfirmDeleteModal = ref(false)
const selectedDeletePeminjam = ref(null)
const deleteLoading = ref(false)

// COMPUTED
const isFuzzySearch = computed(() => fuzzyMode.value && searchQuery.value.length > 0)

const fuzzySuggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 3) return []
  
  const query = searchQuery.value
  const suggestions = new Set()
  
  peminjamList.value.forEach(p => {
    const words = normalizeText(p.nama_peminjam || '').split(' ')
    
    words.forEach(word => {
      if (word.length >= 3) {
        const score = similarityScore(word, query)
        if (score > 0.6 && score < 1) {
          suggestions.add(word)
        }
      }
    })
  })
  
  return Array.from(suggestions).slice(0, 5)
})

function matchesSearch(peminjam, query) {
  if (!query) return true
  
  if (fuzzyMode.value) {
    return textContainsFuzzy(peminjam.nama_peminjam, query, 0.6) ||
           textContainsFuzzy(peminjam.id_peminjam, query, 0.8)
  } else {
    const normalizedQuery = normalizeText(query)
    const namaPeminjam = normalizeText(peminjam.nama_peminjam)
    const idPeminjam = normalizeText(peminjam.id_peminjam)
    
    return namaPeminjam.includes(normalizedQuery) ||
           idPeminjam.includes(normalizedQuery)
  }
}

const filteredPeminjamList = computed(() => {
  let out = [...peminjamList.value]

  const q = searchQuery.value.trim()
  if (q) {
    out = out.filter(p => matchesSearch(p, q))
  }

  return out
})

const totalPages = computed(() => {
  return Math.ceil(filteredPeminjamList.value.length / itemsPerPage.value)
})

const paginatedPeminjamList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredPeminjamList.value.slice(start, end)
})

const displayedPages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2
  
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  })

  return rangeWithDots
})

// FUNGSI SEARCH
function handleSearchInput() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1
  }, config.search.debounceTime)
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
  setTimeout(() => {
    const searchInput = document.querySelector('.search-input')
    if (searchInput) searchInput.focus()
  }, 100)
}

function toggleFuzzyMode() {
  fuzzyMode.value = !fuzzyMode.value
  currentPage.value = 1
}

// FUNGSI PAGINATION
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    gotoPageInput.value = ''
  }
}

function goToGotoPage() {
  const page = Number(gotoPageInput.value)
  if (page && page >= 1 && page <= totalPages.value) {
    goToPage(page)
  } else {
    showAlert('error', 'Error', `Halaman harus antara 1 - ${totalPages.value}`)
  }
  gotoPageInput.value = ''
}

function handleItemsPerPageChange() {
  currentPage.value = 1
}

// FUNGSI LAINNYA
function showAlert(type, title, message) {
  alertType.value = type
  alertTitle.value = title
  alertMessage.value = message
  showAlertModal.value = true
}

function closeAlert() {
  showAlertModal.value = false
}

async function loadPeminjamTable() {
  loading.value = true
  try {
    const rows = await api('/peminjam', { useToken: true })
    peminjamList.value = Array.isArray(rows) ? rows : []
  } catch (err) {
    showAlert('error', 'Gagal', err.message)
  } finally {
    loading.value = false
  }
}

function openPeminjamModal(mode, peminjam = null) {
  modalMode.value = mode
  modalTitle.value = mode === 'create' ? 'Tambah Peminjam' : 'Edit Peminjam'
  selectedPeminjam.value = peminjam
  showModal.value = true
}

function closePeminjamModal() {
  showModal.value = false
  selectedPeminjam.value = null
}

function onPeminjamSuccess(message) {
  showAlert('success', 'Berhasil', message)
  loadPeminjamTable()
  currentPage.value = 1
}

async function editPeminjam(peminjam) {
  try {
    const data = await api(`/peminjam/${encodeURIComponent(peminjam.id_peminjam)}`, { useToken: true })
    openPeminjamModal('edit', data)
  } catch (err) {
    showAlert('error', 'Gagal', err.message)
  }
}

// Fungsi untuk menampilkan modal konfirmasi hapus peminjam
function confirmDeletePeminjam(peminjam) {
  selectedDeletePeminjam.value = peminjam
  showConfirmDeleteModal.value = true
}

// Fungsi untuk menutup modal konfirmasi hapus peminjam
function closeConfirmDeleteModal() {
  showConfirmDeleteModal.value = false
  selectedDeletePeminjam.value = null
  deleteLoading.value = false
}

// Fungsi untuk menghapus peminjam setelah konfirmasi
async function deletePeminjam() {
  if (!selectedDeletePeminjam.value) return
  
  deleteLoading.value = true
  try {
    await api(`/peminjam/${encodeURIComponent(selectedDeletePeminjam.value.id_peminjam)}`, { method: 'DELETE', useToken: true })
    showAlert('success', 'Berhasil', 'Peminjam berhasil dihapus.')
    await loadPeminjamTable()
    currentPage.value = 1
    closeConfirmDeleteModal()
  } catch (err) {
    showAlert('error', 'Gagal', err.message)
    deleteLoading.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/admin/login')
}

onMounted(() => {
  initSessionTracking()
  loadPeminjamTable()
})
</script>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 18px;
  height: calc(100vh - 68px - 18px - 20px); /* Kurangi pengurang seminimal mungkin */
  overflow: hidden;
}

.card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  min-height: 0;
  border-radius: var(--radius);
}

.card-header {
  flex-shrink: 0;
  padding: 16px 16px 12px; /* Kembalikan ke ukuran semula */
}

.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  padding: 16px 16px 8px 16px; /* Kembalikan ke ukuran semula */
  height: 100%;
}

/* Search section - ukuran normal */
.search-section {
  flex-shrink: 0;
  margin-bottom: 8px; /* Kembalikan ke ukuran semula */
}

/* Toolbar - ukuran normal */
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px; /* Kembalikan ke ukuran semula */
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 8px 70px 8px 36px; /* Kembalikan ke ukuran semula */
  border-radius: 30px;
  border: 2px solid var(--border);
  font-size: 14px;
  background: white;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--muted);
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
}

.search-clear {
  position: absolute;
  right: 60px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
}

.fuzzy-badge {
  position: absolute;
  right: 12px;
  background: #f59e0b;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 6px;
  border-radius: 20px;
}

.toolbar-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.toolbar-actions .btn {
  height: 34px; /* Kembalikan ke ukuran semula */
  padding: 0 10px;
  font-size: 13px;
}

/* Search stats - ukuran normal */
.search-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px; /* Kembalikan ke ukuran semula */
  padding: 6px 10px; /* Kembalikan ke ukuran semula */
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid var(--border);
  font-size: 12px;
}

.stats-left {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.stats-left .badge {
  padding: 3px 8px; /* Kembalikan ke ukuran semula */
  font-size: 11px;
}

.stats-right {
  color: var(--muted);
  font-size: 11px;
}

/* Fuzzy suggestions - ukuran normal */
.fuzzy-suggestions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px; /* Kembalikan ke ukuran semula */
  padding: 6px 10px; /* Kembalikan ke ukuran semula */
  background: #fef9c3;
  border-radius: 30px;
  border: 1px solid #fde047;
  font-size: 12px;
}

.suggestion-chip {
  background: white;
  border: 1px solid #fde047;
  padding: 2px 10px; /* Kembalikan ke ukuran semula */
  border-radius: 30px;
  font-size: 12px;
  height: 28px;
}

/* Table wrapper - INI YANG DIUBAH, AMBIL SISA RUANG */
.table-wrap {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid rgba(226,232,240,.9);
  margin-bottom: 8px; /* Kembalikan ke ukuran semula */
  background: white;
}

/* Table styling - TETAP NORMAL */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 800px;
}

th, td {
  padding: 10px 12px; /* Kembalikan ke ukuran semula */
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

th {
  background: #f1f5f9 !important;
  color: #0b1220;
  font-weight: 800;
  font-size: 12px;
  position: sticky;
  top: 0;
  z-index: 5;
}

tr:hover td {
  background: #f8fafc;
}

/* Pagination container - TETAP NORMAL */
.pagination-container {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0 4px 0;
  border-top: 1px solid var(--border);
  background: white;
  border-radius: 0 0 10px 10px;
  margin-top: 0;
}

.pagination {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  font-weight: 600;
  font-size: 12px;
}

.pagination-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.pagination-ellipsis {
  padding: 0 2px;
  color: var(--muted);
  font-weight: 600;
  font-size: 12px;
}

.pagination-go-to {
  display: flex;
  gap: 6px;
  align-items: center;
}

.pagination-go-to .helper {
  font-size: 11px;
}

.pagination-input {
  width: 50px;
  text-align: center;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 12px;
  height: 30px;
}

.pagination-go-to .btn {
  height: 28px;
  padding: 0 8px;
  font-size: 11px;
}

.items-per-page {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-bottom: 4px;
}

.items-per-page .helper {
  font-size: 11px;
}

.items-per-page-select {
  width: auto;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: white;
  cursor: pointer;
  font-size: 12px;
  height: 30px;
}

.top-actions .btn {
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
}

.empty-search-message {
  padding: 24px;
  text-align: center;
  color: var(--muted);
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .shell {
    height: calc(100vh - 68px - 18px - 10px);
  }
  
  .pane {
    padding: 12px 12px 4px 12px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .search-box {
    min-width: 100%;
  }
  
  .toolbar-actions {
    justify-content: stretch;
  }
  
  .toolbar-actions .btn {
    flex: 1;
  }
  
  .search-stats {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .pagination-container {
    padding: 8px 0 4px 0;
  }
}
</style>