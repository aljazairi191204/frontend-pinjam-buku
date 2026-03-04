<template>
  <div>
    <Header brand-link="/" brand-text="Edukarya Library" :nav-links="navLinks" />
    
    <main class="container">
      <section class="hero" id="hero_main">
        <!-- Gambar banner sebagai tag img (reliable di semua browser) -->
        <img src="/assets/banner.png" alt="Banner Perpustakaan" class="hero-banner-img" />
        
        <!-- Overlay putih transparan -->
        <div class="hero-overlay"></div>
        
        <!-- Konten hero -->
        <div class="hero-content">
          <div class="hero-left">
            <h1>Peminjaman Buku Talenta Edukarya</h1>
            <p>Maksimal peminjaman buku {{ loanRules.maxLoanDays }} hari.</p>
          </div>
          <div class="hero-right">
            <p class="quote">
              "Membaca ialah upaya merekuk makna, ikhtiar untuk memahami alam semesta. 
              Itulah mengapa buku disebut jendela dunia, yang merangsang pikiran agar terus terbuka."
              <span class="quote-author">— Mata Najwa</span>
            </p>
          </div>
        </div>
      </section>

      <section v-if="banner.show" class="hero hero-message" :class="banner.type" aria-live="polite">
        <h1 style="font-size:18px; margin:0 0 6px">{{ banner.title }}</h1>
        <p style="margin:0">{{ banner.message || banner.sub }}</p>
      </section>

      <section v-if="pinjamBanner.show" class="hero hero-message" :class="pinjamBanner.type" aria-live="polite">
        <h1 style="font-size:18px; margin:0 0 6px">{{ pinjamBanner.title }}</h1>
        <p style="margin:0">{{ pinjamBanner.message }}</p>
      </section>

      <section class="grid" style="margin-top:18px">
        <div class="card" id="daftar" style="grid-column:1/-1">
          <div class="card-header">
            <h2 class="card-title">Daftar Buku</h2>
            <p class="card-subtitle">Klik "Pinjam" untuk meminjam. Klik "Lihat Peminjam" untuk melihat daftar peminjam. Klik cover buku untuk preview gambar.</p>
            <p class="card-subtitle">Jika buku hilang saat peminjaman laporkan ke Admin.</p>
          </div>

          <div class="card-body">
            <div class="toolbar">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cari buku atau penulis"
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
                <button class="btn" @click="toggleSort('nama')">
                  <span class="sort-icon">{{ sortNamaIcon }}</span>
                  {{ sortNamaLabel }}
                </button>
                <button class="btn" @click="toggleSort('stok')">
                  <span class="sort-icon">{{ sortStokIcon }}</span>
                  {{ sortStokLabel }}
                </button>
              </div>
            </div>

            <div class="search-stats" v-if="filteredBooks.length > 0 || searchQuery">
              <div class="stats-left">
                <span class="badge" :class="{ 'primary': isFuzzySearch }">
                  📚 {{ filteredBooks.length }} buku ditemukan
                </span>
                <span class="badge" :class="{ 'badge-danger': availableBooksCount === 0 }">
                  ✅ {{ availableBooksCount }} tersedia
                </span>
                <span class="badge badge-muted">
                  ❌ {{ unavailableBooksCount }} tidak tersedia
                </span>
                <span v-if="searchQuery" class="badge muted">
                  🔍 Pencarian: "{{ searchQuery }}"
                </span>
                <span v-if="isFuzzySearch && searchQuery" class="badge" style="background: #fef9c3; color: #854d0e;">
                  🔄 Fuzzy match aktif
                </span>
              </div>
              <div class="stats-right helper">
                Menampilkan {{ paginatedBooks.length }} buku • 
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

            <div v-if="loading" class="loading-container">
              <div class="spinner"></div>
              <div class="helper">Memuat data buku...</div>
            </div>

            <div v-else-if="filteredBooks.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              <h3>Tidak ada buku ditemukan</h3>
              <p class="helper">
                {{ searchQuery ? 
                  `Maaf, tidak ada buku yang cocok dengan "${searchQuery}"` : 
                  'Belum ada buku di perpustakaan'
                }}
              </p>
              
              <div v-if="searchQuery && fuzzySuggestions.length > 0" class="fuzzy-suggestions-empty">
                <p class="helper" style="font-weight: bold;">Mungkin Anda mencari:</p>
                <div class="suggestions-buttons">
                  <button 
                    v-for="suggestion in fuzzySuggestions" 
                    :key="suggestion"
                    class="btn primary"
                    @click="searchQuery = suggestion"
                  >
                    {{ suggestion }}
                  </button>
                </div>
              </div>

              <div v-else class="search-suggestions">
                <p class="helper" style="margin-top: 16px; font-weight: bold;">Tips pencarian:</p>
                <ul class="suggestions-list">
                  <li>✓ Gunakan kata kunci yang lebih umum</li>
                  <li>✓ Periksa ejaan kata kunci Anda</li>
                  <li>✓ Aktifkan mode fuzzy untuk toleransi typo</li>
                  <li>✓ Coba "umayah" untuk mencari "umayyah"</li>
                  <li>✓ Coba "alquran" untuk mencari "Al-Qur'an"</li>
                </ul>
                <button class="btn" @click="clearSearch" style="margin-top: 16px;">
                  ✕ Hapus pencarian
                </button>
              </div>
            </div>

            <div v-else class="books">
              <BookCard
                v-for="book in paginatedBooks"
                :key="book.id_buku"
                :book="book"
                :loans="cachedByBookId[book.id_buku] || []"
                @borrow="openBorrowModal"
                @view-loans="openLoanListModal"
                @preview-cover="openCoverPreview"
              />
            </div>

            <div v-if="filteredBooks.length > itemsPerPage" class="pagination-container">
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

            <div v-if="filteredBooks.length > 0" class="items-per-page">
              <span class="helper">Tampilkan per halaman:</span>
              <select v-model="itemsPerPage" @change="handleItemsPerPageChange" class="items-per-page-select">
                <option v-for="option in uiConfig.itemsPerPage" :key="option" :value="option">
                  {{ option }} buku
                </option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <footer class="footer">
        <div class="helper">Copyright © 2026 Edukarya Ecosystem</div>
      </footer>
    </main>

    <div class="modal-backdrop" :class="{ show: showCoverPreview }" @click.self="closeCoverPreview">
      <div class="modal" style="max-width: 600px;">
        <div class="modal-head">
          <h3 class="modal-title">Preview Cover - {{ previewBookTitle }}</h3>
          <button class="btn close-btn" type="button" @click="closeCoverPreview">Tutup</button>
        </div>
        <div class="modal-body" style="text-align: center; padding: 20px;">
          <img 
            v-if="previewCoverUrl" 
            :src="previewCoverUrl" 
            :alt="previewBookTitle" 
            style="max-width: 100%; max-height: 70vh; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);"
          />
          <div v-else class="no-image-preview" style="padding: 40px; background: #f1f5f9; border-radius: 12px;">
            <span style="font-size: 48px;">🖼️</span>
            <p class="helper" style="margin-top: 10px;">Tidak ada gambar cover</p>
          </div>
          <div class="helper" style="margin-top: 16px;">
            Klik di luar gambar untuk menutup
          </div>
        </div>
      </div>
    </div>

    <BorrowModal
      :show="showBorrowModal"
      :book="selectedBook"
      @close="closeBorrowModal"
      @success="onBorrowSuccess"
    />

    <LoanListModal
      :show="showLoanListModal"
      :book="selectedBookForLoans"
      :loans="selectedLoans"
      @close="closeLoanListModal"
      @return="openReturnModal"
    />

    <ReturnModal
      :show="showReturnModal"
      :loan="selectedLoan"
      @close="closeReturnModal"
      @success="onReturnSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import Header from '../components/Header.vue'
import BookCard from '../components/BookCard.vue'
import BorrowModal from '../components/BorrowModal.vue'
import LoanListModal from '../components/LoanListModal.vue'
import ReturnModal from '../components/ReturnModal.vue'
import { useApi } from '../composables/useApi'
import { useDateTime } from '../composables/useDateTime'
import { useBase64 } from '../composables/useBase64'
import { useSearch } from '../composables/useSearch'
import config from '../config/app.config'

const { api } = useApi()
const { fmtDateTime } = useDateTime()
const { b64ToDataUrl } = useBase64()
const { 
  normalizeText, 
  textContainsFuzzy,
  calculateFuzzyRelevance,
  similarityScore
} = useSearch()

const loanRules = config.loanRules
const uiConfig = config.ui

const navLinks = []

const loading = ref(true)
const cachedBooks = ref([])
const cachedByBookId = ref({})
const searchQuery = ref('')
const fuzzyMode = ref(config.search.fuzzyModeDefault)
const sortNamaAsc = ref(true)
const sortStokDesc = ref(true)
const activeSort = ref('nama')

const banner = reactive({
  show: false,
  type: '',
  title: '',
  sub: ''
})

const pinjamBanner = reactive({
  show: false,
  type: '',
  title: '',
  message: ''
})

const currentPage = ref(1)
const itemsPerPage = ref(config.ui.defaultItemsPerPage)
const gotoPageInput = ref('')
const searchTimeout = ref(null)

const showBorrowModal = ref(false)
const showLoanListModal = ref(false)
const showReturnModal = ref(false)
const selectedBook = ref(null)
const selectedBookForLoans = ref(null)
const selectedLoans = ref([])
const selectedLoan = ref(null)

const showCoverPreview = ref(false)
const previewCoverUrl = ref('')
const previewBookTitle = ref('')

const isFuzzySearch = computed(() => fuzzyMode.value && searchQuery.value.length > 0)

const availableBooksCount = computed(() => {
  return filteredBooks.value.filter(book => (Number(book.jumlah) || 0) > 0).length
})

const unavailableBooksCount = computed(() => {
  return filteredBooks.value.filter(book => (Number(book.jumlah) || 0) === 0).length
})

const sortNamaIcon = computed(() => sortNamaAsc.value ? '⬆️' : '⬇️')
const sortStokIcon = computed(() => sortStokDesc.value ? '⬇️' : '⬆️')

const sortNamaLabel = computed(() => 
  sortNamaAsc.value ? 'Nama (A-Z)' : 'Nama (Z-A)'
)

const sortStokLabel = computed(() => 
  sortStokDesc.value ? 'Stok (Tertinggi)' : 'Stok (Terendah)'
)

const fuzzySuggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 3) return []
  
  const query = searchQuery.value
  const suggestions = new Set()
  
  cachedBooks.value.forEach(book => {
    const words = [
      ...normalizeText(book.nama_buku).split(' '),
      ...normalizeText(book.penulis_buku).split(' ')
    ]
    
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

function matchesSearch(book, query) {
  if (!query) return true
  
  if (fuzzyMode.value) {
    return textContainsFuzzy(book.nama_buku, query, 0.6) || 
           textContainsFuzzy(book.penulis_buku, query, 0.6) ||
           textContainsFuzzy(book.id_buku, query, 0.8)
  } else {
    const normalizedQuery = normalizeText(query)
    const namaBuku = normalizeText(book.nama_buku)
    const penulisBuku = normalizeText(book.penulis_buku)
    const idBuku = normalizeText(book.id_buku)
    
    return namaBuku.includes(normalizedQuery) || 
           penulisBuku.includes(normalizedQuery) ||
           idBuku.includes(normalizedQuery)
  }
}

function getRelevanceScore(book, query) {
  if (!query) return 1
  
  if (fuzzyMode.value) {
    const namaScore = calculateFuzzyRelevance(book.nama_buku, query)
    const penulisScore = calculateFuzzyRelevance(book.penulis_buku, query)
    const idScore = calculateFuzzyRelevance(book.id_buku, query)
    
    return Math.max(namaScore, penulisScore, idScore * 0.8)
  } else {
    const normalizedQuery = normalizeText(query)
    const namaBuku = normalizeText(book.nama_buku)
    const penulisBuku = normalizeText(book.penulis_buku)
    
    if (namaBuku === normalizedQuery) return 100
    if (penulisBuku === normalizedQuery) return 90
    if (namaBuku.includes(normalizedQuery)) return 80
    if (penulisBuku.includes(normalizedQuery)) return 70
    return 1
  }
}

const filteredBooks = computed(() => {
  let out = [...cachedBooks.value]

  const q = searchQuery.value.trim()
  if (q) {
    out = out.filter(book => matchesSearch(book, q))
    
    if (out.length > 0) {
      out.sort((a, b) => {
        const scoreA = getRelevanceScore(a, q)
        const scoreB = getRelevanceScore(b, q)
        return scoreB - scoreA
      })
    }
  }

  if (!q) {
    if (activeSort.value === 'nama') {
      out.sort((a, b) => {
        const A = String(a.nama_buku || '').toLowerCase()
        const B = String(b.nama_buku || '').toLowerCase()
        const cmp = A.localeCompare(B, 'id')
        return sortNamaAsc.value ? cmp : -cmp
      })
    } else if (activeSort.value === 'stok') {
      out.sort((a, b) => {
        const A = Number(a.jumlah) || 0
        const B = Number(b.jumlah) || 0
        return sortStokDesc.value ? B - A : A - B
      })
    }
  }

  return out
})

const totalPages = computed(() => {
  return Math.ceil(filteredBooks.value.length / itemsPerPage.value)
})

const paginatedBooks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredBooks.value.slice(start, end)
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

function toggleSort(type) {
  if (type === 'nama') {
    if (activeSort.value === 'nama') {
      sortNamaAsc.value = !sortNamaAsc.value
    } else {
      activeSort.value = 'nama'
      sortNamaAsc.value = true
    }
  } else if (type === 'stok') {
    if (activeSort.value === 'stok') {
      sortStokDesc.value = !sortStokDesc.value
    } else {
      activeSort.value = 'stok'
      sortStokDesc.value = true
    }
  }
  currentPage.value = 1
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    scrollToTop()
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    scrollToTop()
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    gotoPageInput.value = ''
    scrollToTop()
  }
}

function goToGotoPage() {
  const page = Number(gotoPageInput.value)
  if (page && page >= 1 && page <= totalPages.value) {
    goToPage(page)
  } else {
    showPinjamBanner('error', 'Error', `Halaman harus antara 1 - ${totalPages.value}`)
  }
  gotoPageInput.value = ''
}

function handleItemsPerPageChange() {
  currentPage.value = 1
}

function scrollToTop() {
  const element = document.getElementById('daftar')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function showPinjamBanner(type, title, message) {
  pinjamBanner.show = true
  pinjamBanner.type = type === 'success' ? 'ok' : 'late'
  pinjamBanner.title = title
  pinjamBanner.message = message
  
  setTimeout(() => {
    pinjamBanner.show = false
  }, 5000)
}

function showReturnBanner({ type, title, sub }) {
  banner.show = true
  banner.type = type === 'ok' ? 'ok' : 'late'
  banner.title = title
  banner.sub = sub
  
  const hero = document.getElementById('hero_main')
  if (hero && hero.scrollIntoView) {
    hero.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  
  setTimeout(() => {
    banner.show = false
  }, 5000)
}

function openCoverPreview(base64, title) {
  previewCoverUrl.value = b64ToDataUrl(base64)
  previewBookTitle.value = title
  showCoverPreview.value = true
}

function closeCoverPreview() {
  showCoverPreview.value = false
  previewCoverUrl.value = ''
  previewBookTitle.value = ''
}

function openBorrowModal(book) {
  selectedBook.value = book
  showBorrowModal.value = true
}

function closeBorrowModal() {
  showBorrowModal.value = false
  selectedBook.value = null
}

function openLoanListModal(book, loans) {
  selectedBookForLoans.value = book
  selectedLoans.value = loans
  showLoanListModal.value = true
}

function closeLoanListModal() {
  showLoanListModal.value = false
  selectedBookForLoans.value = null
  selectedLoans.value = []
}

function openReturnModal(loan) {
  selectedLoan.value = loan
  showReturnModal.value = true
}

function closeReturnModal() {
  showReturnModal.value = false
  selectedLoan.value = null
}

async function onBorrowSuccess() {
  await loadBooks()
  closeBorrowModal()
  showPinjamBanner('success', 'Berhasil', 'Buku berhasil dipinjam.')
}

function onReturnSuccess(bannerData) {
  showReturnBanner(bannerData)
  loadBooks()
}

async function loadBooks() {
  loading.value = true
  try {
    const [books, activeLoans] = await Promise.all([
      api('/buku'),
      api('/peminjaman/active')
    ])
    
    cachedBooks.value = Array.isArray(books) ? books : []
    cachedByBookId.value = activeLoans?.byBookId || {}
    
    currentPage.value = 1
  } catch (err) {
    showPinjamBanner('error', 'Gagal', err.message)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadBooks()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.search-box {
  flex: 1;
  min-width: 280px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--muted);
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 12px 80px 12px 40px;
  border-radius: 30px;
  border: 2px solid var(--border);
  font-size: 15px;
  transition: all 0.2s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
}

.search-input.fuzzy-active {
  border-color: #f59e0b;
  background-color: #fffbeb;
}

.search-input::placeholder {
  color: #94a3b8;
  font-style: italic;
}

.search-clear {
  position: absolute;
  right: 70px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;
}

.search-clear:hover {
  background: #f1f5f9;
  color: var(--text);
}

.fuzzy-badge {
  position: absolute;
  right: 12px;
  background: #f59e0b;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 20px;
  z-index: 1;
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sort-icon {
  font-size: 14px;
  margin-right: 4px;
}

.search-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.stats-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stats-right {
  color: var(--muted);
}

.fuzzy-suggestions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #fef9c3;
  border-radius: 30px;
  border: 1px solid #fde047;
}

.suggestion-chip {
  background: white;
  border: 1px solid #fde047;
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 13px;
  height: auto;
}

.suggestion-chip:hover {
  background: #fde047;
  border-color: #eab308;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: var(--radius);
  border: 2px dashed var(--border);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: var(--text);
  font-size: 20px;
}

.fuzzy-suggestions-empty {
  margin-top: 24px;
  padding: 16px;
  background: #fef9c3;
  border-radius: 16px;
}

.suggestions-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 12px;
}

.search-suggestions {
  max-width: 400px;
  margin: 0 auto;
  text-align: left;
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
}

.suggestions-list li {
  padding: 6px 0;
  color: var(--muted);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggestions-list li:before {
  content: "•";
  color: var(--primary);
  font-weight: bold;
  font-size: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.pagination {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-btn {
  min-width: 40px;
  height: 40px;
  padding: 0 8px;
  font-weight: 600;
}

.pagination-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  pointer-events: none;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.pagination-ellipsis {
  padding: 0 4px;
  color: var(--muted);
  font-weight: 600;
}

.pagination-go-to {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-input {
  width: 70px;
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.items-per-page {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.items-per-page-select {
  width: auto;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: white;
  cursor: pointer;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2,6,23,.75);
  display: none;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 1000;
  overflow-y: auto;
}

.modal-backdrop.show {
  display: flex;
}

.modal {
  width: min(600px, 100%);
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(226,232,240,.9);
  box-shadow: 0 30px 80px rgba(2,6,23,.28);
  max-height: calc(100vh - 36px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.2s ease-out;
}

.modal-head {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(226,232,240,.85);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 14px;
  font-weight: 950;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1 1 auto;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.no-image-preview {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px dashed var(--border);
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
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
  
  .pagination {
    gap: 4px;
  }
  
  .pagination-btn {
    min-width: 36px;
    height: 36px;
    font-size: 12px;
  }
  
  .fuzzy-suggestions {
    justify-content: center;
  }
  
  .modal-title {
    max-width: 200px;
    font-size: 13px;
  }
}

/* Optimasi Mobile Tambahan */
@media (max-width: 640px) {
  .container {
    padding: 12px;
  }
  
  .hero {
    padding: 16px;
  }
  
  .card-body {
    padding: 12px;
  }
  
  #hero_main h1 {
    font-size: 20px;
  }
  
  #hero_main p {
    font-size: 14px;
  }
  
  .card-title {
    font-size: 14px;
  }
  
  .card-subtitle {
    font-size: 12px;
  }
  
  .helper {
    font-size: 11px;
  }
  
  /* BookCard optimasi */
  .books {
    gap: 8px;
  }
  
  .book :deep(.book-cover) {
    width: 70px;
    height: 105px;
  }
  
  .book :deep(.book-name) {
    font-size: 13px;
  }
  
  .book :deep(.book-author) {
    font-size: 12px;
  }
  
  .book :deep(.badge) {
    font-size: 10px;
    padding: 3px 6px;
  }
  
  .book :deep(.btn) {
    height: 34px;
    padding: 0 8px;
    font-size: 12px;
  }
  
  /* Pagination optimasi */
  .pagination-container {
    gap: 8px;
    margin-top: 16px;
  }
  
  .pagination {
    gap: 3px;
  }
  
  .pagination-btn {
    min-width: 36px;
    height: 36px;
    font-size: 12px;
    padding: 0 4px;
  }
  
  .pagination-go-to {
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  
  .pagination-input {
    width: 50px;
    padding: 6px;
    font-size: 14px;
  }
  
  .items-per-page {
    justify-content: center;
    margin-top: 8px;
    gap: 8px;
  }
  
  .items-per-page-select {
    padding: 6px 8px;
    font-size: 13px;
  }
  
  /* Touch targets */
  .btn {
    min-height: 44px;
  }
  
  .toolbar-actions .btn {
    height: 44px;
  }
  
  .pagination-btn {
    min-height: 40px;
  }
  
  .search-input {
    font-size: 16px;
    padding: 10px 70px 10px 36px;
  }
  
  /* Modal optimasi */
  .modal {
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-body {
    padding: 12px;
  }
  
  .modal-title {
    font-size: 13px;
    max-width: 180px;
  }
  
  .modal .btn.close-btn {
    padding: 0 8px;
    font-size: 12px;
    height: 36px;
  }
  
  /* Preview cover */
  .modal img {
    max-height: 50vh;
  }
}

/* Untuk layar sangat kecil */
@media (max-width: 480px) {
  .book :deep(.book-cover) {
    width: 60px;
    height: 90px;
  }
  
  .badge {
    font-size: 9px;
    padding: 2px 5px;
  }
  
  .pagination-btn {
    min-width: 32px;
    height: 32px;
    font-size: 11px;
  }
  
  .toolbar-actions {
    gap: 4px;
  }
  
  .toolbar-actions .btn {
    font-size: 11px;
    padding: 0 6px;
  }
}
#hero_main {
  position: relative;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: none;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(5px);
}

#hero_main::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/assets/banner.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
  opacity: 0.9;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30px;
  padding: 20px;
  width: 100%;
}

.hero-left {
  flex: 1;
}

.hero-left h1 {
  color: #0f172a;
  text-shadow: 0 2px 4px rgba(255,255,255,0.8);
  font-size: 32px;
  margin: 0 0 8px;
}

.hero-left p {
  color: #1e293b;
  text-shadow: 0 1px 2px rgba(255,255,255,0.8);
  font-weight: 500;
  margin: 0;
}

.hero-right {
  flex: 1;
  max-width: 500px;
}

.quote {
  font-family: 'Hamakor Book', 'Times New Roman', serif;
  text-align: right;
  color: #0f172a; /* Lebih gelap dari sebelumnya (#1e293b) */
  text-shadow: 0 2px 4px rgba(255,255,255,0.9); /* Shadow lebih kuat */
  font-size: 16px;
  line-height: 1.6;
  font-style: italic;
  margin: 0;
  padding: 0;
  font-weight: 500; /* Sedikit lebih tebal */
}

.quote-author {
  display: block;
  font-family: 'Hamakor Book', 'Times New Roman', serif;
  text-align: right;
  color: #0f172a; /* Lebih gelap dari sebelumnya (#475569) */
  font-size: 14px;
  font-weight: 700; /* Lebih tebal */
  margin-top: 8px;
  font-style: normal;
  text-shadow: 0 1px 3px rgba(255,255,255,0.9); /* Shadow lebih kuat */
}

/* High-DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  #hero_main::before {
    background-image: url('/assets/banner@2x.png');
  }
}

@media (max-width: 640px) {
  #hero_main {
    min-height: auto;
  }
  
  .hero-content {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .hero-left h1 {
    font-size: 24px;
    text-align: center;
  }
  
  .hero-left p {
    text-align: center;
  }
  
  .hero-right {
    max-width: 100%;
  }
  
  .quote {
    font-size: 14px;
    text-align: center;
  }
  
  .quote-author {
    text-align: center;
  }
}
</style>