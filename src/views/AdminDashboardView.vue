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
        <h1>Dashboard Admin</h1>
        <p>Kelola buku (CRUD) dan lihat riwayat peminjaman.</p>
      </section>

      <section class="shell">
        <aside class="card sidebar">
          <div class="card-header">
            <h2 class="card-title">Menu</h2>
            <p class="card-subtitle">Pilih tab untuk mengelola data.</p>
          </div>
          <div class="card-body">
            <div class="stack">
              <button 
                class="tab" 
                :class="{ active: activeTab === 'buku' }" 
                @click="setActiveTab('buku')"
                style="text-align:left"
              >
                Tab Kelola Buku
              </button>
              <button 
                class="tab" 
                :class="{ active: activeTab === 'peminjaman' }" 
                @click="setActiveTab('peminjaman')"
                style="text-align:left"
              >
                Tab Data Peminjaman
              </button>
            </div>
          </div>
        </aside>

        <section class="card main">
          <div class="tabs" style="justify-content:space-between; align-items:center">
            <div class="top-actions">
              <button v-if="activeTab === 'buku'" class="btn primary" @click="openBukuModal('create')">+ Tambah Buku</button>
              <button v-if="activeTab === 'buku'" class="btn" @click="toggleSort">{{ sortLabel }}</button>
              <button v-if="activeTab === 'peminjaman'" class="btn danger" @click="openClearPinjamModal">Hapus Semua</button>
            </div>
          </div>

          <!-- TAB BUKU -->
          <div v-show="activeTab === 'buku'" class="pane">
            <div class="search-section">
              <div class="toolbar">
                <div class="search-box">
                  <span class="search-icon">🔍</span>
                  <input
                    v-model="bukuSearchQuery"
                    type="text"
                    placeholder="Cari buku berdasarkan judul atau penulis"
                    class="search-input"
                    :class="{ 'fuzzy-active': isBukuFuzzySearch }"
                    @input="handleBukuSearchInput"
                  />
                  <button 
                    v-if="bukuSearchQuery" 
                    class="search-clear" 
                    @click="clearBukuSearch"
                    title="Hapus pencarian"
                  >
                    ✕
                  </button>
                  <span v-if="isBukuFuzzySearch" class="fuzzy-badge" title="Pencarian fuzzy aktif (toleransi typo)">
                    🔄 Fuzzy
                  </span>
                </div>

                <div class="toolbar-actions">
                  <button 
                    class="btn" 
                    :class="{ 'primary': bukuFuzzyMode }"
                    @click="toggleBukuFuzzyMode"
                    :title="bukuFuzzyMode ? 'Fuzzy search aktif' : 'Fuzzy search nonaktif'"
                  >
                    <span class="sort-icon">🔎</span>
                    {{ bukuFuzzyMode ? 'Pencarian Optimal: ON' : 'Pencarian Optimal: OFF' }}
                  </button>
                </div>
              </div>

              <div class="search-stats" v-if="filteredBukuList.length > 0 || bukuSearchQuery">
                <div class="stats-left">
                  <span class="badge" :class="{ 'primary': isBukuFuzzySearch }">
                    📚 {{ filteredBukuList.length }} buku ditemukan
                  </span>
                  <span v-if="bukuSearchQuery" class="badge muted">
                    🔍 Pencarian: "{{ bukuSearchQuery }}"
                  </span>
                  <span v-if="isBukuFuzzySearch && bukuSearchQuery" class="badge" style="background: #fef9c3; color: #854d0e;">
                    🔄 Fuzzy match aktif
                  </span>
                </div>
                <div class="stats-right helper">
                  Menampilkan {{ paginatedBukuList.length }} buku • 
                  Halaman {{ bukuCurrentPage }} dari {{ bukuTotalPages }}
                </div>
              </div>

              <div v-if="bukuFuzzySuggestions.length > 0" class="fuzzy-suggestions">
                <span class="helper">Mungkin maksud Anda:</span>
                <button 
                  v-for="suggestion in bukuFuzzySuggestions" 
                  :key="suggestion"
                  class="btn suggestion-chip"
                  @click="bukuSearchQuery = suggestion"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>

            <div class="table-wrap" style="margin-top:10px">
              <table id="buku_table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Gambar</th>
                    <th>Nama Buku</th>
                    <th>Penulis</th>
                    <th>Stok</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="bukuLoading">
                    <td colspan="7">Memuat…</td>
                  </tr>
                  <tr v-else-if="paginatedBukuList.length === 0">
                    <td colspan="7">
                      <div class="empty-search-message">
                        {{ bukuSearchQuery ? `Tidak ada buku yang cocok dengan "${bukuSearchQuery}"` : 'Belum ada buku.' }}
                      </div>
                    </td>
                  </tr>
                  <tr v-for="b in paginatedBukuList" :key="b.id_buku">
                    <td>{{ b.id_buku }}</td>
                    <td>
                        <div class="cover-thumbnail" @click="openCoverPreview(b.gambar_buku, b.nama_buku)">
                          <img 
                            v-if="b.gambar_buku" 
                            :src="b64ToDataUrl(b.gambar_buku)" 
                            alt="cover" 
                            style="width:60px;height:90px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb; cursor:pointer; transition: transform 0.2s ease;"
                            class="clickable-cover"
                          />
                          <span v-else class="badge muted">-</span>
                        </div>
                      </td>
                    <td>{{ b.nama_buku }}</td>
                    <td>{{ b.penulis_buku }}</td>
                    <td>{{ b.jumlah }}</td>
                    <td>{{ b.status === 'tersedia' ? 'Tersedia' : 'Dipinjam' }}</td>
                    <td>
                      <button class="btn" @click="editBuku(b)">Edit</button>
                      <button class="btn danger" @click="confirmDeleteBuku(b)">Hapus</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PAGINATION BUKU -->
            <div v-if="filteredBukuList.length > bukuItemsPerPage" class="pagination-container">
              <div class="pagination">
                <button 
                  class="btn pagination-btn" 
                  :disabled="bukuCurrentPage === 1"
                  @click="goToBukuPage(1)"
                  title="Halaman pertama"
                >
                  ⟪
                </button>
                <button 
                  class="btn pagination-btn" 
                  :disabled="bukuCurrentPage === 1"
                  @click="prevBukuPage"
                >
                  ←
                </button>

                <template v-for="page in bukuDisplayedPages" :key="page">
                  <button 
                    v-if="page !== '...'"
                    class="btn pagination-btn" 
                    :class="{ 'active primary': bukuCurrentPage === page }"
                    @click="goToBukuPage(page)"
                  >
                    {{ page }}
                  </button>
                  <span v-else class="pagination-ellipsis">...</span>
                </template>

                <button 
                  class="btn pagination-btn" 
                  :disabled="bukuCurrentPage === bukuTotalPages"
                  @click="nextBukuPage"
                >
                  →
                </button>
                <button 
                  class="btn pagination-btn" 
                  :disabled="bukuCurrentPage === bukuTotalPages"
                  @click="goToBukuPage(bukuTotalPages)"
                  title="Halaman terakhir"
                >
                  ⟫
                </button>
              </div>

              <div class="pagination-go-to">
                <span class="helper">Lompat ke</span>
                <input 
                  type="number" 
                  v-model.number="bukuGotoPageInput" 
                  min="1" 
                  :max="bukuTotalPages"
                  @keyup.enter="goToBukuGotoPage"
                  class="pagination-input"
                  placeholder="No"
                />
                <button class="btn" @click="goToBukuGotoPage">Go</button>
              </div>
            </div>

            <div v-if="filteredBukuList.length > 0" class="items-per-page">
              <span class="helper">Tampilkan per halaman:</span>
              <select v-model="bukuItemsPerPage" @change="handleBukuItemsPerPageChange" class="items-per-page-select">
                <option v-for="option in uiConfig.itemsPerPage" :key="option" :value="option">
                  {{ option }} buku
                </option>
              </select>
            </div>
          </div>

          <!-- TAB PEMINJAMAN -->
          <div v-show="activeTab === 'peminjaman'" class="pane">
            <div class="search-section">
              <div class="toolbar">
                <div class="search-box">
                  <span class="search-icon">🔍</span>
                  <input
                    v-model="pinjamSearchQuery"
                    type="text"
                    placeholder="Cari berdasarkan nama peminjam, judul buku, atau ID"
                    class="search-input"
                    :class="{ 'fuzzy-active': isPinjamFuzzySearch }"
                    @input="handlePinjamSearchInput"
                  />
                  <button 
                    v-if="pinjamSearchQuery" 
                    class="search-clear" 
                    @click="clearPinjamSearch"
                    title="Hapus pencarian"
                  >
                    ✕
                  </button>
                  <span v-if="isPinjamFuzzySearch" class="fuzzy-badge" title="Pencarian fuzzy aktif (toleransi typo)">
                    🔄 Fuzzy
                  </span>
                </div>

                <div class="toolbar-actions">
                  <button 
                    class="btn" 
                    :class="{ 'primary': pinjamFuzzyMode }"
                    @click="togglePinjamFuzzyMode"
                    :title="pinjamFuzzyMode ? 'Fuzzy search aktif' : 'Fuzzy search nonaktif'"
                  >
                    <span class="sort-icon">🔎</span>
                    {{ pinjamFuzzyMode ? 'Pencarian Optimal: ON' : 'Pencarian Optimal: OFF' }}
                  </button>
                </div>
              </div>

              <div class="search-stats" v-if="filteredPinjamList.length > 0 || pinjamSearchQuery">
                <div class="stats-left">
                  <span class="badge" :class="{ 'primary': isPinjamFuzzySearch }">
                    📋 {{ filteredPinjamList.length }} data ditemukan
                  </span>
                  <span v-if="pinjamSearchQuery" class="badge muted">
                    🔍 Pencarian: "{{ pinjamSearchQuery }}"
                  </span>
                  <span v-if="isPinjamFuzzySearch && pinjamSearchQuery" class="badge" style="background: #fef9c3; color: #854d0e;">
                    🔄 Fuzzy match aktif
                  </span>
                </div>
                <div class="stats-right helper">
                  Menampilkan {{ paginatedPinjamList.length }} data • 
                  Halaman {{ pinjamCurrentPage }} dari {{ pinjamTotalPages }}
                </div>
              </div>
            </div>

            <div class="table-wrap" style="margin-top:10px">
              <table id="pinjam_table">
                <thead>
                  <tr>
                    <th>ID Peminjam</th>
                    <th>ID Buku</th>
                    <th>Gambar</th>
                    <th>Nama Peminjam</th>
                    <th>Tgl Pinjam</th>
                    <th>Tgl Pengembalian</th>
                    <th>Status</th>
                    <th>Bukti</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="pinjamLoading">
                    <td colspan="9">Memuat…</td>
                  </tr>
                  <tr v-else-if="paginatedPinjamList.length === 0">
                    <td colspan="9">
                      <div class="empty-search-message">
                        {{ pinjamSearchQuery ? `Tidak ada data yang cocok dengan "${pinjamSearchQuery}"` : 'Belum ada riwayat peminjaman.' }}
                      </div>
                    </td>
                  </tr>
                  <tr v-for="r in paginatedPinjamList" :key="r._id">
                    <td>{{ r.id_peminjam || '-' }}</td>
                    <td>{{ r.id_buku || '-' }}</td>
                    <td>
                      <div class="cover-thumbnail" @click="openCoverPreview(r.gambar_buku, r.nama_buku || 'Buku')">
                        <img 
                          v-if="r.gambar_buku" 
                          :src="b64ToDataUrl(r.gambar_buku)" 
                          alt="cover" 
                          style="width:60px;height:90px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb; cursor:pointer; transition: transform 0.2s ease;"
                          class="clickable-cover"
                        />
                        <span v-else class="badge muted">-</span>
                      </div>
                    </td>
                    <td>{{ r.nama_peminjam || '-' }}</td>
                    <td>{{ fmtDateTime(r.tanggal_pinjam) }}</td>
                    <td>{{ fmtDateTime(r.tanggal_pengembalian) }}</td>
                    <td>
                      <span 
                        class="badge" 
                        :class="{
                          'badge-success': r.status_pengembalian === 'dikembalikan tepat waktu',
                          'badge-warning': r.status_pengembalian === 'dikembalikan terlambat',
                          'badge-danger': r.status_pengembalian === 'buku hilang',
                          'badge-primary': r.status_pengembalian === 'dipinjam'
                        }"
                      >
                        {{ r.status_pengembalian || '-' }}
                      </span>
                    </td>
                    <td>
                      <button 
                        v-if="r.bukti_pengembalian" 
                        class="btn" 
                        @click="openBuktiPreview(r.bukti_pengembalian)"
                        title="Lihat bukti pengembalian"
                      >
                        📸 Lihat
                      </button>
                      <span v-else-if="r.status_pengembalian === 'buku hilang'" class="badge badge-danger">
                        ❌ Hilang
                      </span>
                      <span v-else class="badge muted">-</span>
                    </td>
                    <td>
                      <button 
                        v-if="r.status_pengembalian === 'dipinjam'"
                        class="btn danger" 
                        @click="openHilangModal(r)"
                        style="margin-right:5px;"
                        title="Laporkan buku hilang"
                      >
                        📕 Hilang
                      </button>
                      <button class="btn danger" @click="confirmDeletePeminjaman(r)">Hapus</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PAGINATION PEMINJAMAN -->
            <div v-if="filteredPinjamList.length > pinjamItemsPerPage" class="pagination-container">
              <div class="pagination">
                <button 
                  class="btn pagination-btn" 
                  :disabled="pinjamCurrentPage === 1"
                  @click="goToPinjamPage(1)"
                  title="Halaman pertama"
                >
                  ⟪
                </button>
                <button 
                  class="btn pagination-btn" 
                  :disabled="pinjamCurrentPage === 1"
                  @click="prevPinjamPage"
                >
                  ←
                </button>

                <template v-for="page in pinjamDisplayedPages" :key="page">
                  <button 
                    v-if="page !== '...'"
                    class="btn pagination-btn" 
                    :class="{ 'active primary': pinjamCurrentPage === page }"
                    @click="goToPinjamPage(page)"
                  >
                    {{ page }}
                  </button>
                  <span v-else class="pagination-ellipsis">...</span>
                </template>

                <button 
                  class="btn pagination-btn" 
                  :disabled="pinjamCurrentPage === pinjamTotalPages"
                  @click="nextPinjamPage"
                >
                  →
                </button>
                <button 
                  class="btn pagination-btn" 
                  :disabled="pinjamCurrentPage === pinjamTotalPages"
                  @click="goToPinjamPage(pinjamTotalPages)"
                  title="Halaman terakhir"
                >
                  ⟫
                </button>
              </div>

              <div class="pagination-go-to">
                <span class="helper">Lompat ke</span>
                <input 
                  type="number" 
                  v-model.number="pinjamGotoPageInput" 
                  min="1" 
                  :max="pinjamTotalPages"
                  @keyup.enter="goToPinjamGotoPage"
                  class="pagination-input"
                  placeholder="No"
                />
                <button class="btn" @click="goToPinjamGotoPage">Go</button>
              </div>
            </div>

            <div v-if="filteredPinjamList.length > 0" class="items-per-page">
              <span class="helper">Tampilkan per halaman:</span>
              <select v-model="pinjamItemsPerPage" @change="handlePinjamItemsPerPageChange" class="items-per-page-select">
                <option v-for="option in uiConfig.itemsPerPage" :key="option" :value="option">
                  {{ option }} data
                </option>
              </select>
            </div>
          </div>
        </section>
      </section>
    </main>

    <BukuModal
      :show="showBukuModal"
      :mode="bukuModalMode"
      :title="bukuModalTitle"
      :initial="selectedBuku"
      @close="closeBukuModal"
      @success="onBukuSuccess"
    />

    <ClearPinjamModal
      :show="showClearPinjamModal"
      @close="closeClearPinjamModal"
      @confirm="onClearPinjamSuccess"
    />

    <HilangModal
      :show="showHilangModal"
      :peminjaman="selectedHilangPeminjaman"
      :buku="selectedHilangBuku"
      @close="closeHilangModal"
      @success="onHilangSuccess"
    />

        <!-- Modal Preview Cover -->
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

    <!-- Modal Preview Bukti -->
    <div class="modal-backdrop" :class="{ show: showBuktiPreview }" @click.self="closeBuktiPreview">
      <div class="modal" style="max-width: 600px;">
        <div class="modal-head">
          <h3 class="modal-title">Bukti Pengembalian</h3>
          <button class="btn close-btn" type="button" @click="closeBuktiPreview">Tutup</button>
        </div>
        <div class="modal-body" style="text-align: center;">
          <img 
            v-if="previewBukti" 
            :src="previewBukti" 
            alt="Bukti Pengembalian" 
            style="max-width: 100%; max-height: 70vh; border-radius: 12px;"
          />
          <div class="helper" style="margin-top: 10px;">
            Klik di luar gambar untuk menutup
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal untuk Buku -->
    <div class="modal-backdrop" :class="{ show: showConfirmDeleteBukuModal }" @click.self="closeConfirmDeleteBukuModal">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3 class="modal-title">Konfirmasi Hapus Buku</h3>
          <button class="btn close-btn" type="button" @click="closeConfirmDeleteBukuModal">Tutup</button>
        </div>
        <div class="modal-body">
          <div class="helper" style="margin-bottom:12px">
            Apakah anda yakin akan menghapus buku <strong>{{ selectedDeleteBuku?.nama_buku }}</strong> dengan ID <strong>{{ selectedDeleteBuku?.id_buku }}</strong>?
          </div>

          <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap">
            <button class="btn cancel-btn" type="button" @click="closeConfirmDeleteBukuModal">Batal</button>
            <button class="btn danger" type="button" @click="deleteBuku" :disabled="deleteBukuLoading">Ya, Hapus</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal untuk Peminjaman -->
    <div class="modal-backdrop" :class="{ show: showConfirmDeletePeminjamanModal }" @click.self="closeConfirmDeletePeminjamanModal">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3 class="modal-title">Konfirmasi Hapus Data Peminjaman</h3>
          <button class="btn close-btn" type="button" @click="closeConfirmDeletePeminjamanModal">Tutup</button>
        </div>
        <div class="modal-body">
          <div class="helper" style="margin-bottom:12px">
            Apakah anda yakin akan menghapus data peminjaman untuk <strong>{{ selectedDeletePeminjaman?.nama_peminjam }}</strong>?
            <br><br>
            <span style="font-size: 12px; color: var(--muted);">
              ID Peminjaman: {{ selectedDeletePeminjaman?._id }}<br>
              Buku: {{ selectedDeletePeminjaman?.id_buku }}<br>
              Tanggal Pinjam: {{ fmtDateTime(selectedDeletePeminjaman?.tanggal_pinjam) }}
            </span>
          </div>
          
          <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap">
            <button class="btn cancel-btn" type="button" @click="closeConfirmDeletePeminjamanModal">Batal</button>
            <button class="btn danger" type="button" @click="deletePeminjaman" :disabled="deletePeminjamanLoading">Ya, Hapus</button>
          </div>
        </div>
      </div>
    </div>

    <AlertModal
      :show="showBukuAlertModal"
      :type="bukuAlertType"
      :title="bukuAlertTitle"
      :message="bukuAlertMessage"
      :button-type="bukuAlertType === 'error' ? 'danger' : 'success'"
      @close="closeBukuAlert"
      @confirm="closeBukuAlert"
    />

    <AlertModal
      :show="showPinjamAlertModal"
      :type="pinjamAlertType"
      :title="pinjamAlertTitle"
      :message="pinjamAlertMessage"
      :button-type="pinjamAlertType === 'error' ? 'danger' : 'success'"
      @close="closePinjamAlert"
      @confirm="closePinjamAlert"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../components/Header.vue'
import BukuModal from '../components/BukuModal.vue'
import ClearPinjamModal from '../components/ClearPinjamModal.vue'
import AlertModal from '../components/AlertModal.vue'
import { useApi } from '../composables/useApi'
import { useAuthStore } from '../stores/auth'
import { useSessionTimeout } from '../composables/useSessionTimeout'
import { useBase64 } from '../composables/useBase64'
import { useDateTime } from '../composables/useDateTime'
import { useSearch } from '../composables/useSearch'
import config from '../config/app.config'
import HilangModal from '../components/HilangModal.vue'

// State untuk modal hilang
const showHilangModal = ref(false)
const selectedHilangPeminjaman = ref(null)
const selectedHilangBuku = ref(null)

// Fungsi untuk membuka modal hilang
async function openHilangModal(peminjaman) {
  try {
    console.log('Membuka modal hilang untuk peminjaman:', peminjaman)
    
    // Ambil data buku untuk ditampilkan di modal
    const buku = await api(`/buku/${encodeURIComponent(peminjaman.id_buku)}`)
    
    // Pastikan objek peminjaman memiliki _id (MongoDB ID)
    selectedHilangPeminjaman.value = peminjaman
    selectedHilangBuku.value = buku
    showHilangModal.value = true
  } catch (err) {
    showPinjamAlert('error', 'Gagal memuat data buku: ' + err.message)
  }
}

function closeHilangModal() {
  showHilangModal.value = false
  selectedHilangPeminjaman.value = null
  selectedHilangBuku.value = null
}

function onHilangSuccess(data) {
  showPinjamAlert('success', data.message || 'Buku berhasil dilaporkan hilang')
  loadPeminjamanTable()
  closeHilangModal()
}
// State untuk preview cover
const showCoverPreview = ref(false)
const previewCoverUrl = ref('')
const previewBookTitle = ref('')

// Fungsi untuk preview cover
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

const router = useRouter()
const { api } = useApi()
const authStore = useAuthStore()
const { initSessionTracking } = useSessionTimeout()
const { b64ToDataUrl } = useBase64()
const { fmtDateTime } = useDateTime()
const { 
  normalizeText, 
  textContainsFuzzy,
  similarityScore
} = useSearch()

const uiConfig = config.ui

const navLinks = [
  { to: '/admin/peminjam', text: 'Peminjam' },
  { to: '/', text: 'Publik' }
]

const activeTab = ref('buku')
const bukuSortAsc = ref(true)
const bukuLoading = ref(true)
const pinjamLoading = ref(true)
const bukuList = ref([])
const pinjamList = ref([])

// State untuk pencarian BUKU
const bukuSearchQuery = ref('')
const bukuFuzzyMode = ref(config.search.fuzzyModeDefault)
const bukuSearchTimeout = ref(null)

// State untuk pagination BUKU
const bukuCurrentPage = ref(1)
const bukuItemsPerPage = ref(config.ui.defaultItemsPerPage)
const bukuGotoPageInput = ref('')

// State untuk pencarian PEMINJAMAN
const pinjamSearchQuery = ref('')
const pinjamFuzzyMode = ref(config.search.fuzzyModeDefault)
const pinjamSearchTimeout = ref(null)

// State untuk pagination PEMINJAMAN
const pinjamCurrentPage = ref(1)
const pinjamItemsPerPage = ref(config.ui.defaultItemsPerPage)
const pinjamGotoPageInput = ref('')

const showBukuAlertModal = ref(false)
const bukuAlertTitle = ref('')
const bukuAlertMessage = ref('')
const bukuAlertType = ref('success')

const showPinjamAlertModal = ref(false)
const pinjamAlertTitle = ref('')
const pinjamAlertMessage = ref('')
const pinjamAlertType = ref('success')

const showBukuModal = ref(false)
const bukuModalMode = ref('create')
const bukuModalTitle = ref('Tambah Buku')
const selectedBuku = ref(null)
const showClearPinjamModal = ref(false)

const showBuktiPreview = ref(false)
const previewBukti = ref('')

// State untuk confirm delete buku
const showConfirmDeleteBukuModal = ref(false)
const selectedDeleteBuku = ref(null)
const deleteBukuLoading = ref(false)

// State untuk confirm delete peminjaman
const showConfirmDeletePeminjamanModal = ref(false)
const selectedDeletePeminjaman = ref(null)
const deletePeminjamanLoading = ref(false)

// COMPUTED UNTUK BUKU
const isBukuFuzzySearch = computed(() => bukuFuzzyMode.value && bukuSearchQuery.value.length > 0)

const bukuFuzzySuggestions = computed(() => {
  if (!bukuSearchQuery.value || bukuSearchQuery.value.length < 3) return []
  
  const query = bukuSearchQuery.value
  const suggestions = new Set()
  
  bukuList.value.forEach(book => {
    const words = [
      ...normalizeText(book.nama_buku || '').split(' '),
      ...normalizeText(book.penulis_buku || '').split(' ')
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

function matchesBukuSearch(book, query) {
  if (!query) return true
  
  if (bukuFuzzyMode.value) {
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

const filteredBukuList = computed(() => {
  let out = [...bukuList.value]

  const q = bukuSearchQuery.value.trim()
  if (q) {
    out = out.filter(book => matchesBukuSearch(book, q))
  }

  out = [...out].sort((x, y) => {
    const A = String(x.id_buku || '')
    const B = String(y.id_buku || '')
    const cmp = A.localeCompare(B, 'id', { numeric: true, sensitivity: 'base' })
    return bukuSortAsc.value ? cmp : -cmp
  })

  return out
})

const bukuTotalPages = computed(() => {
  return Math.ceil(filteredBukuList.value.length / bukuItemsPerPage.value)
})

const paginatedBukuList = computed(() => {
  const start = (bukuCurrentPage.value - 1) * bukuItemsPerPage.value
  const end = start + bukuItemsPerPage.value
  return filteredBukuList.value.slice(start, end)
})

const bukuDisplayedPages = computed(() => {
  const total = bukuTotalPages.value
  const current = bukuCurrentPage.value
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

// COMPUTED UNTUK PEMINJAMAN
const isPinjamFuzzySearch = computed(() => pinjamFuzzyMode.value && pinjamSearchQuery.value.length > 0)

function matchesPinjamSearch(row, query) {
  if (!query) return true
  
  if (pinjamFuzzyMode.value) {
    return textContainsFuzzy(row.nama_peminjam || '', query, 0.6) ||
           textContainsFuzzy(row.id_buku || '', query, 0.8) ||
           textContainsFuzzy(row.id_peminjam || '', query, 0.8) ||
           textContainsFuzzy(row.status_pengembalian || '', query, 0.7)
  } else {
    const normalizedQuery = normalizeText(query)
    const namaPeminjam = normalizeText(row.nama_peminjam || '')
    const idBuku = normalizeText(row.id_buku || '')
    const idPeminjam = normalizeText(row.id_peminjam || '')
    const status = normalizeText(row.status_pengembalian || '')
    
    return namaPeminjam.includes(normalizedQuery) ||
           idBuku.includes(normalizedQuery) ||
           idPeminjam.includes(normalizedQuery) ||
           status.includes(normalizedQuery)
  }
}

const filteredPinjamList = computed(() => {
  let out = [...pinjamList.value]

  const q = pinjamSearchQuery.value.trim()
  if (q) {
    out = out.filter(row => matchesPinjamSearch(row, q))
  }

  return out
})

const pinjamTotalPages = computed(() => {
  return Math.ceil(filteredPinjamList.value.length / pinjamItemsPerPage.value)
})

const paginatedPinjamList = computed(() => {
  const start = (pinjamCurrentPage.value - 1) * pinjamItemsPerPage.value
  const end = start + pinjamItemsPerPage.value
  return filteredPinjamList.value.slice(start, end)
})

const pinjamDisplayedPages = computed(() => {
  const total = pinjamTotalPages.value
  const current = pinjamCurrentPage.value
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

const sortLabel = computed(() => 
  bukuSortAsc.value ? 'Sort ID (Asc)' : 'Sort ID (Desc)'
)

// FUNGSI UNTUK BUKU
function handleBukuSearchInput() {
  if (bukuSearchTimeout.value) {
    clearTimeout(bukuSearchTimeout.value)
  }
  
  bukuSearchTimeout.value = setTimeout(() => {
    bukuCurrentPage.value = 1
  }, config.search.debounceTime)
}

function clearBukuSearch() {
  bukuSearchQuery.value = ''
  bukuCurrentPage.value = 1
}

function toggleBukuFuzzyMode() {
  bukuFuzzyMode.value = !bukuFuzzyMode.value
  bukuCurrentPage.value = 1
}

// Pagination functions BUKU
function nextBukuPage() {
  if (bukuCurrentPage.value < bukuTotalPages.value) {
    bukuCurrentPage.value++
  }
}

function prevBukuPage() {
  if (bukuCurrentPage.value > 1) {
    bukuCurrentPage.value--
  }
}

function goToBukuPage(page) {
  if (page >= 1 && page <= bukuTotalPages.value) {
    bukuCurrentPage.value = page
    bukuGotoPageInput.value = ''
  }
}

function goToBukuGotoPage() {
  const page = Number(bukuGotoPageInput.value)
  if (page && page >= 1 && page <= bukuTotalPages.value) {
    goToBukuPage(page)
  } else {
    showBukuAlert('error', `Halaman harus antara 1 - ${bukuTotalPages.value}`)
  }
  bukuGotoPageInput.value = ''
}

function handleBukuItemsPerPageChange() {
  bukuCurrentPage.value = 1
}

// FUNGSI UNTUK PEMINJAMAN
function handlePinjamSearchInput() {
  if (pinjamSearchTimeout.value) {
    clearTimeout(pinjamSearchTimeout.value)
  }
  
  pinjamSearchTimeout.value = setTimeout(() => {
    pinjamCurrentPage.value = 1
  }, config.search.debounceTime)
}

function clearPinjamSearch() {
  pinjamSearchQuery.value = ''
  pinjamCurrentPage.value = 1
}

function togglePinjamFuzzyMode() {
  pinjamFuzzyMode.value = !pinjamFuzzyMode.value
  pinjamCurrentPage.value = 1
}

// Pagination functions PEMINJAMAN
function nextPinjamPage() {
  if (pinjamCurrentPage.value < pinjamTotalPages.value) {
    pinjamCurrentPage.value++
  }
}

function prevPinjamPage() {
  if (pinjamCurrentPage.value > 1) {
    pinjamCurrentPage.value--
  }
}

function goToPinjamPage(page) {
  if (page >= 1 && page <= pinjamTotalPages.value) {
    pinjamCurrentPage.value = page
    pinjamGotoPageInput.value = ''
  }
}

function goToPinjamGotoPage() {
  const page = Number(pinjamGotoPageInput.value)
  if (page && page >= 1 && page <= pinjamTotalPages.value) {
    goToPinjamPage(page)
  } else {
    showPinjamAlert('error', `Halaman harus antara 1 - ${pinjamTotalPages.value}`)
  }
  pinjamGotoPageInput.value = ''
}

function handlePinjamItemsPerPageChange() {
  pinjamCurrentPage.value = 1
}

function setActiveTab(tab) {
  activeTab.value = tab
  if (tab === 'buku') {
    loadBukuTable()
    bukuCurrentPage.value = 1
  }
  if (tab === 'peminjaman') {
    loadPeminjamanTable()
    pinjamCurrentPage.value = 1
  }
}

function toggleSort() {
  bukuSortAsc.value = !bukuSortAsc.value
  loadBukuTable()
  bukuCurrentPage.value = 1
}

function showBukuAlert(type, msg) {
  bukuAlertType.value = type
  bukuAlertTitle.value = type === 'success' ? 'Berhasil' : 'Gagal'
  bukuAlertMessage.value = msg
  showBukuAlertModal.value = true
}

function closeBukuAlert() {
  showBukuAlertModal.value = false
}

function showPinjamAlert(type, msg) {
  pinjamAlertType.value = type
  pinjamAlertTitle.value = type === 'success' ? 'Berhasil' : 'Gagal'
  pinjamAlertMessage.value = msg
  showPinjamAlertModal.value = true
}

function closePinjamAlert() {
  showPinjamAlertModal.value = false
}

async function loadBukuTable() {
  bukuLoading.value = true
  try {
    let books = await api('/buku')
    if (!Array.isArray(books)) books = []
    bukuList.value = books
  } catch (err) {
    showBukuAlert('error', err.message)
  } finally {
    bukuLoading.value = false
  }
}

async function loadPeminjamanTable() {
  pinjamLoading.value = true
  try {
    const rows = await api('/peminjaman/admin', { useToken: true })
    pinjamList.value = Array.isArray(rows) ? rows : []
  } catch (err) {
    showPinjamAlert('error', err.message)
  } finally {
    pinjamLoading.value = false
  }
}

function openBukuModal(mode, buku = null) {
  bukuModalMode.value = mode
  bukuModalTitle.value = mode === 'create' ? 'Tambah Buku' : 'Edit Buku'
  selectedBuku.value = buku
  showBukuModal.value = true
}

function closeBukuModal() {
  showBukuModal.value = false
  selectedBuku.value = null
}

function onBukuSuccess(message) {
  showBukuAlert('success', message)
  loadBukuTable()
  bukuCurrentPage.value = 1
}

async function editBuku(buku) {
  try {
    const b = await api(`/buku/${encodeURIComponent(buku.id_buku)}`)
    openBukuModal('edit', b)
  } catch (err) {
    showBukuAlert('error', err.message)
  }
}

// Fungsi untuk menampilkan modal konfirmasi hapus buku
function confirmDeleteBuku(buku) {
  selectedDeleteBuku.value = buku
  showConfirmDeleteBukuModal.value = true
}

// Fungsi untuk menutup modal konfirmasi hapus buku
function closeConfirmDeleteBukuModal() {
  showConfirmDeleteBukuModal.value = false
  selectedDeleteBuku.value = null
  deleteBukuLoading.value = false
}

// Fungsi untuk menghapus buku setelah konfirmasi
async function deleteBuku() {
  if (!selectedDeleteBuku.value) return
  
  deleteBukuLoading.value = true
  try {
    await api(`/buku/${encodeURIComponent(selectedDeleteBuku.value.id_buku)}`, { method: 'DELETE', useToken: true })
    showBukuAlert('success', 'Buku berhasil dihapus.')
    await loadBukuTable()
    bukuCurrentPage.value = 1
    closeConfirmDeleteBukuModal()
  } catch (err) {
    showBukuAlert('error', err.message)
    deleteBukuLoading.value = false
  }
}

// Fungsi untuk menampilkan modal konfirmasi hapus peminjaman
function confirmDeletePeminjaman(row) {
  // Cek apakah status masih dipinjam
  if (row.status_pengembalian === 'dipinjam') {
    showPinjamAlert('error', 'Tidak dapat menghapus data peminjaman yang masih berstatus "dipinjam". Silakan kembalikan buku terlebih dahulu.')
    return
  }
  
  selectedDeletePeminjaman.value = row
  showConfirmDeletePeminjamanModal.value = true
}

// Fungsi untuk menutup modal konfirmasi hapus peminjaman
function closeConfirmDeletePeminjamanModal() {
  showConfirmDeletePeminjamanModal.value = false
  selectedDeletePeminjaman.value = null
  deletePeminjamanLoading.value = false
}

// Fungsi untuk menghapus peminjaman setelah konfirmasi
async function deletePeminjaman() {
  if (!selectedDeletePeminjaman.value) return
  
  deletePeminjamanLoading.value = true
  try {
    await api(`/peminjaman/admin/${encodeURIComponent(selectedDeletePeminjaman.value._id)}`, { method: 'DELETE', useToken: true })
    showPinjamAlert('success', 'Data peminjaman berhasil dihapus.')
    await loadPeminjamanTable()
    pinjamCurrentPage.value = 1
    closeConfirmDeletePeminjamanModal()
  } catch (err) {
    showPinjamAlert('error', err.message)
    deletePeminjamanLoading.value = false
  }
}

function openClearPinjamModal() {
  const activeLoans = pinjamList.value.filter(p => p.status_pengembalian === 'dipinjam')
  
  if (activeLoans.length > 0) {
    showPinjamAlert('error', `Tidak dapat menghapus semua data. Masih terdapat ${activeLoans.length} data peminjaman dengan status "dipinjam". Silakan kembalikan semua buku terlebih dahulu.`)
    return
  }
  
  showClearPinjamModal.value = true
}

function closeClearPinjamModal() {
  showClearPinjamModal.value = false
}

function onClearPinjamSuccess(message) {
  showPinjamAlert('success', message)
  loadPeminjamanTable()
  pinjamCurrentPage.value = 1
}

function openBuktiPreview(base64) {
  previewBukti.value = `data:image/jpeg;base64,${base64}`
  showBuktiPreview.value = true
}

function closeBuktiPreview() {
  showBuktiPreview.value = false
  previewBukti.value = ''
}

function handleLogout() {
  authStore.logout()
  router.push('/admin/login')
}

onMounted(() => {
  initSessionTracking()
  loadBukuTable()
})
</script>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  margin-top: 18px;
  height: calc(100vh - 68px - 18px - 20px); /* Dikurangi untuk memberikan ruang */
  overflow: hidden;
}

@media (max-width: 980px) {
  .shell {
    grid-template-columns: 1fr;
    height: auto;
  }
}

.sidebar {
  padding: 14px;
}

.sidebar .btn {
  width: 100%;
}

.sidebar .stack {
  display: grid;
  gap: 10px;
}

.main {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  min-height: 0;
}

.pane {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  padding: 12px 16px 8px 16px; /* Kurangi padding vertical */
  height: 100%;
}

/* Compact search section */
.search-section {
  margin-bottom: 8px; /* Kurangi margin */
  flex-shrink: 0;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px; /* Kurangi margin */
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
  padding: 8px 70px 8px 36px; /* Kurangi padding vertical */
  border-radius: 30px;
  border: 2px solid var(--border);
  font-size: 14px; /* Kurangi font size */
  transition: all 0.2s ease;
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
  height: 34px; /* Kurangi tinggi tombol */
  padding: 0 10px;
  font-size: 13px;
}

.sort-icon {
  font-size: 12px;
  margin-right: 2px;
}

.search-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px; /* Kurangi margin */
  padding: 6px 10px; /* Kurangi padding */
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
  padding: 3px 8px;
  font-size: 11px;
}

.stats-right {
  color: var(--muted);
  font-size: 11px;
}

.fuzzy-suggestions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px; /* Kurangi margin */
  padding: 6px 10px;
  background: #fef9c3;
  border-radius: 30px;
  border: 1px solid #fde047;
  font-size: 12px;
}

.suggestion-chip {
  background: white;
  border: 1px solid #fde047;
  padding: 2px 10px; /* Kurangi padding */
  border-radius: 30px;
  font-size: 12px;
  height: 28px; /* Kurangi tinggi */
}

/* Table wrapper - lebih besar */
.table-wrap {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: auto;
  min-height: 0;
  border-radius: 10px;
  border: 1px solid rgba(226,232,240,.9);
  height: 100%;
  max-height: 100%;
  margin-bottom: 8px; /* Kurangi margin */
}

table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 12px; /* Kurangi font size tabel */
}

th, td {
  padding: 8px 10px; /* Kurangi padding sel */
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
  background: white;
}

th {
  background: #f1f5f9 !important;
  color: #0b1220;
  font-weight: 800;
  font-size: 12px;
}

td img {
  width: 60px !important; /* Perkecil gambar */
  height: 90px !important;
  border-radius: 6px;
}

.table-wrap thead th {
  position: sticky;
  top: 0;
  z-index: 5;
  background: #f1f5f9 !important;
}

/* Compact pagination */
.pagination-container {
  margin-top: 8px; /* Kurangi margin */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.pagination {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-btn {
  min-width: 32px; /* Perkecil tombol */
  height: 32px;
  padding: 0 6px;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s ease;
}

.pagination-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  pointer-events: none;
  transform: scale(1.05);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
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
  width: 50px; /* Perkecil input */
  text-align: center;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 12px;
}

.pagination-go-to .btn {
  height: 28px;
  padding: 0 8px;
  font-size: 11px;
}

.items-per-page {
  margin-top: 8px; /* Kurangi margin */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
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

/* Responsive */
@media (max-width: 768px) {
  .pane {
    padding: 8px;
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
    height: 36px;
  }
  
  .search-stats {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .fuzzy-suggestions {
    justify-content: center;
  }
  
  .pagination {
    gap: 4px;
  }
  
  .pagination-btn {
    min-width: 34px;
    height: 34px;
    font-size: 12px;
  }
  
  .pagination-go-to {
    width: 100%;
    justify-content: center;
  }
  
  .items-per-page {
    justify-content: center;
  }
}

.cover-thumbnail {
  display: inline-block;
  cursor: pointer;
}

.clickable-cover:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.no-image-preview {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px dashed var(--border);
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

.badge-success {
  background: #dcfce7 !important;
  color: #166534 !important;
  border-color: #bbf7d0 !important;
}

.badge-warning {
  background: #fed7aa !important;
  color: #9a3412 !important;
  border-color: #fdba74 !important;
}

.badge-primary {
  background: #dbeafe !important;
  color: #1e40af !important;
  border-color: #bfdbfe !important;
}
</style>