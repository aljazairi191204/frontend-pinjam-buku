<template>
  <div class="modal-backdrop" :class="{ show: show }" @click.self="handleClose">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">Peminjaman Buku</h3>
        <button class="btn close-btn" type="button" @click="handleClose">Tutup</button>
      </div>
      <div class="modal-body">
        <form class="form" @submit.prevent="handleSubmit">
          <input type="hidden" v-model="form.id_buku" />

          <div class="field">
            <label>Buku</label>
            <div class="book-info-display">
              <div class="book-cover-mini" v-if="coverUrl">
                <img :src="coverUrl" :alt="form.nama_buku" />
              </div>
              <input :value="form.nama_buku" disabled />
            </div>
          </div>

          <div class="field">
            <label for="borrow_id_peminjam">Pilih Peminjam</label>
            <SearchableSelect
              v-model="form.id_peminjam"
              :options="peminjamOptions"
              placeholder="Cari atau pilih peminjam..."
              @change="handlePeminjamChange"
            />
            <div class="helper">Ketik untuk mencari nama peminjam</div>
          </div>

          <div class="field">
            <label>Tanggal Pinjam</label>
            <input :value="fmtDateTime(new Date())" disabled />
            <div class="helper">Otomatis mengikuti tanggal device.</div>
          </div>

          <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; margin-top:6px">
            <button class="btn cancel-btn" type="button" @click="handleClose">Batal</button>
            <button class="btn primary" type="submit" :disabled="loading">Konfirmasi Pinjam</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useApi } from '../composables/useApi'
import { useDateTime } from '../composables/useDateTime'
import { useBase64 } from '../composables/useBase64'
import SearchableSelect from './SearchableSelect.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  book: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

const { api } = useApi()
const { fmtDateTime } = useDateTime()
const { b64ToDataUrl } = useBase64()
const loading = ref(false)

const peminjamList = ref([])

const form = reactive({
  id_buku: '',
  id_peminjam: '',
  nama_buku: ''
})

// Computed untuk cover buku
const coverUrl = computed(() => {
  if (props.book?.gambar_buku) {
    return b64ToDataUrl(props.book.gambar_buku)
  }
  return ''
})

// Computed untuk options dropdown
const peminjamOptions = computed(() => {
  return peminjamList.value.map(p => ({
    value: p.id_peminjam,
    label: p.nama_peminjam
  }))
})

function resetForm() {
  form.id_buku = props.book?.id_buku || ''
  form.id_peminjam = ''
  form.nama_buku = props.book?.nama_buku || ''
}

watch(() => props.book, (book) => {
  resetForm()
}, { immediate: true })

watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

onMounted(async () => {
  await loadPeminjamDropdown()
})

async function loadPeminjamDropdown() {
  try {
    const data = await api('/peminjam/public')
    peminjamList.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Gagal memuat peminjam:', err)
  }
}

function handlePeminjamChange(option) {
  // Optional: bisa menambahkan logika tambahan saat peminjam dipilih
  console.log('Peminjam dipilih:', option)
}

async function handleSubmit() {
  if (!form.id_buku) {
    alert('Buku belum dipilih.')
    return
  }
  if (!form.id_peminjam) {
    alert('Silakan pilih peminjam.')
    return
  }

  loading.value = true
  try {
    await api('/peminjaman/pinjam', { 
      method: 'POST', 
      body: { id_buku: form.id_buku, id_peminjam: form.id_peminjam } 
    })
    
    emit('success')
    
    resetForm()
    setTimeout(() => handleClose(), 350)
  } catch (err) {
    alert(err.message)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  resetForm()
  emit('close')
}
</script>

<style scoped>
.book-info-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.book-cover-mini {
  width: 40px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.book-cover-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-info-display input {
  flex: 1;
}
</style>