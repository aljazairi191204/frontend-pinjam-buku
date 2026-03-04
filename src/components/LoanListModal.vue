<template>
  <div class="modal-backdrop" :class="{ show: show }" @click.self="handleClose">
    <div class="modal large" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">
          👥 Daftar Peminjam - {{ book?.nama_buku || 'Buku' }}
        </h3>
        <button class="btn close-btn" type="button" @click="handleClose">Tutup</button>
      </div>
      
      <div class="modal-body">
        <!-- Info buku -->
        <div class="book-info" style="display: flex; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border);">
          <div class="book-cover-small" style="width: 60px; height: 90px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); flex-shrink: 0;">
            <img v-if="coverUrl" :src="coverUrl" :alt="book?.nama_buku" style="width: 100%; height: 100%; object-fit: cover;" />
            <div v-else style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: var(--muted); font-size: 10px; text-align: center;">No Image</div>
          </div>
          <div>
            <h4 style="margin: 0 0 4px 0; font-size: 16px;">{{ book?.nama_buku }}</h4>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: var(--muted);">Penulis: {{ book?.penulis_buku }}</p>
            <p style="margin: 0; font-size: 14px;"><span class="badge">Stok tersedia: {{ book?.jumlah || 0 }}</span></p>
          </div>
        </div>

        <!-- Tabel daftar peminjam -->
        <div v-if="loans.length > 0" class="table-wrap" style="max-height: 300px; overflow-y: auto;">
          <table style="min-width: 100%;">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Peminjam</th>
                <th>ID Peminjam</th>
                <th>Tanggal Pinjam</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(loan, index) in loans" :key="loan.id_peminjaman">
                <td>{{ index + 1 }}</td>
                <td>{{ loan.nama_peminjam }}</td>
                <td><span class="badge muted">{{ loan.id_peminjam }}</span></td>
                <td>{{ fmtDateTime(loan.tanggal_pinjam) }}</td>
                <td>
                  <button 
                    class="btn primary" 
                    style="height: 32px; padding: 0 12px; font-size: 12px;"
                    @click="handleReturn(loan)"
                  >
                    Kembalikan
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-state" style="padding: 40px 20px;">
          <div class="empty-icon" style="font-size: 48px; margin-bottom: 16px;">📭</div>
          <h4 style="margin: 0 0 8px 0;">Tidak Ada Peminjam</h4>
          <p class="helper">Buku ini sedang tidak dipinjam oleh siapapun.</p>
        </div>

        <!-- Footer buttons -->
        <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; margin-top:20px;">
          <button class="btn cancel-btn" type="button" @click="handleClose">Tutup</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBase64 } from '../composables/useBase64'
import { useDateTime } from '../composables/useDateTime'

const props = defineProps({
  show: { type: Boolean, default: false },
  book: { type: Object, default: null },
  loans: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'return'])

const { b64ToDataUrl } = useBase64()
const { fmtDateTime } = useDateTime()

const coverUrl = computed(() => props.book?.gambar_buku ? b64ToDataUrl(props.book.gambar_buku) : '')

function handleReturn(loan) {
  emit('return', loan)
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.table-wrap {
  border-radius: 12px;
  border: 1px solid var(--border);
  background: white;
}

.table-wrap table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table-wrap th {
  background: #f8fafc;
  padding: 12px;
  font-weight: 700;
  color: var(--text);
  position: sticky;
  top: 0;
  z-index: 5;
}

.table-wrap td {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.table-wrap tr:last-child td {
  border-bottom: none;
}

.table-wrap tr:hover td {
  background: #f8fafc;
}

.book-cover-small {
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

@media (max-width: 640px) {
  .book-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .table-wrap {
    font-size: 12px;
  }
  
  .table-wrap th, 
  .table-wrap td {
    padding: 8px 6px;
  }
}
</style>