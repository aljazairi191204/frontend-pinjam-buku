<template>
  <article class="book" :data-book="book.id_buku">
    <div class="book-cover" :class="{ 'cover-disabled': stok === 0 }" @click="openPreview">
      <img v-if="coverUrl" :src="coverUrl" :alt="'Cover ' + book.nama_buku" />
      <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#1d4ed8;">
        No Image
      </div>
    </div>

    <div class="book-meta" style="flex:1">
      <div class="book-name">{{ book.nama_buku }}</div>
      <div class="book-author">{{ book.penulis_buku }}</div>

      <div class="badges">
        <span class="badge" :class="{ 'badge-danger': stok === 0 }">Stok: {{ stok }}</span>
        <span v-if="stok === 0" class="badge badge-danger">❌ Tidak Tersedia</span>
      </div>

      <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap; align-items:center">
        <button 
          :class="['btn', pinjamBtnClass]" 
          type="button" 
          :disabled="stok === 0"
          @click="handleBorrow"
        >
          Pinjam
        </button>
        
        <button 
          v-if="loans.length > 0"
          class="btn primary" 
          type="button"
          @click="$emit('view-loans', book, loans)"
        >
          👥 Lihat Peminjam ({{ loans.length }})
        </button>
      </div>

      <div v-if="loans.length === 0 && stok > 0" style="margin-top:10px" class="helper">
        Belum ada yang meminjam.
      </div>
      
      <div v-if="loans.length === 0 && stok === 0" style="margin-top:10px" class="helper">
        Belum ada riwayat peminjaman.
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useBase64 } from '../composables/useBase64'

const props = defineProps({
  book: { type: Object, required: true },
  loans: { type: Array, default: () => [] }
})

const emit = defineEmits(['borrow', 'view-loans', 'preview-cover'])

const { b64ToDataUrl } = useBase64()
const coverUrl = computed(() => props.book.gambar_buku ? b64ToDataUrl(props.book.gambar_buku) : '')
const stok = computed(() => Number(props.book.jumlah) || 0)
const pinjamBtnClass = computed(() => {
  if (stok.value <= 0) return 'btn-disabled'
  return 'primary'
})

function handleBorrow() {
  if (stok.value > 0) {
    emit('borrow', props.book)
  }
}

function openPreview() {
  if (props.book.gambar_buku) {
    emit('preview-cover', props.book.gambar_buku, props.book.nama_buku)
  }
}
</script>

<style scoped>
.book {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(226,232,240,.85);
  border-radius: var(--radius-sm);
  transition: transform .08s ease, box-shadow .15s ease, border-color .15s ease, opacity .15s ease;
}

.book:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(2,6,23,.06);
  border-color: rgba(37,99,235,.35);
}

/* Hapus semua style .book-disabled */

.badge-danger {
  background: #fee2e2 !important;
  color: #b91c1c !important;
  border-color: #fecaca !important;
  font-weight: 700;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  background: #e2e8f0 !important;
  border-color: #cbd5e1 !important;
  color: #64748b !important;
}

.btn-disabled:hover {
  transform: none;
  box-shadow: none;
}

.text-muted {
  color: #94a3b8;
  font-style: italic;
}

.book-cover {
  width: 100px;
  height: 151px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(37,99,235,.18), rgba(37,99,235,.06));
  border: 1px solid rgba(226,232,240,.9);
  overflow: hidden;
  flex: 0 0 auto;
  transition: opacity 0.15s ease, filter 0.15s ease, transform 0.2s ease;
  cursor: pointer;
}

.book-cover:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}

.book-cover:hover img {
  transform: scale(1.05);
}

.book-name {
  margin: 0;
  font-weight: 800;
  font-size: 14px;
  line-height: 1.2;
  transition: color 0.15s ease;
}

.book-author {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--muted);
  transition: color 0.15s ease;
}

.badges {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(226,232,240,.9);
  background: rgba(37,99,235,.06);
  color: var(--primary-600);
  font-weight: 750;
  font-size: 12px;
}

.badge.primary {
  background: rgba(37,99,235,.1);
  color: var(--primary-600);
  border-color: rgba(37,99,235,.3);
}

.helper {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.45;
}
.cover-disabled {
  opacity: 0.5;
  filter: grayscale(80%);
}

.cover-disabled:hover {
  opacity: 0.7;
  filter: grayscale(60%);
}
</style>