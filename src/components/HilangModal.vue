<template>
  <div class="modal-backdrop" :class="{ show: show }" @click.self="handleClose">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">📕 Konfirmasi Buku Hilang</h3>
        <button class="btn close-btn" type="button" @click="handleClose">Tutup</button>
      </div>
      
      <div class="modal-body">
        <div class="helper" style="margin-bottom:16px">
          Apakah Anda yakin ingin melaporkan buku ini sebagai <strong>HILANG</strong>?
        </div>

        <!-- Info Peminjaman -->
        <div class="card" style="box-shadow:none; border:1px solid rgba(226,232,240,.9); margin-bottom:16px;">
          <div class="card-body" style="padding:12px">
            <table style="width:100%; border-collapse:collapse; font-size:13px; min-width:auto;">
              <tr>
                <td style="padding:6px 0; font-weight:600; width:120px;">Nama Peminjam</td>
                <td style="padding:6px 0;">: {{ peminjaman?.nama_peminjam || '-' }}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:600;">Nama Buku</td>
                <td style="padding:6px 0;">: {{ buku?.nama_buku || '-' }}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:600;">ID Buku</td>
                <td style="padding:6px 0;">: {{ peminjaman?.id_buku || '-' }}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:600;">ID Peminjaman</td>
                <td style="padding:6px 0;">: {{ peminjaman?._id || peminjaman?.id_peminjaman || '-' }}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-weight:600;">Tanggal Pinjam</td>
                <td style="padding:6px 0;">: {{ fmtDateTime(peminjaman?.tanggal_pinjam) }}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Preview Cover Buku (jika ada) -->
        <div v-if="coverUrl" class="cover-preview" style="text-align:center; margin-bottom:16px;">
          <img 
            :src="coverUrl" 
            :alt="buku?.nama_buku" 
            style="max-width:150px; max-height:200px; border-radius:8px; border:2px solid var(--border);"
          />
        </div>

        <!-- Keterangan (opsional) -->
        <div class="field">
          <label for="keterangan">Keterangan (opsional)</label>
          <textarea 
            id="keterangan"
            v-model="keterangan" 
            placeholder="Masukkan keterangan tambahan..."
            rows="3"
          ></textarea>
          <div class="helper">Misalnya: buku rusak parah, cover hilang, dll.</div>
        </div>

        <!-- Banner error -->
        <div v-if="error" class="alert error show" style="margin-top:10px;">
          {{ error }}
        </div>

        <!-- Tombol aksi -->
        <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; margin-top:16px;">
          <button class="btn cancel-btn" type="button" @click="handleClose">Batal</button>
          <button 
            class="btn danger" 
            type="button" 
            @click="handleConfirm" 
            :disabled="loading"
          >
            {{ loading ? 'Memproses...' : 'Ya, Laporkan Hilang' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useApi } from '../composables/useApi'
import { useDateTime } from '../composables/useDateTime'
import { useBase64 } from '../composables/useBase64'

const props = defineProps({
  show: { type: Boolean, default: false },
  peminjaman: { type: Object, default: null },
  buku: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

const { api } = useApi()
const { fmtDateTime } = useDateTime()
const { b64ToDataUrl } = useBase64()

const loading = ref(false)
const error = ref('')
const keterangan = ref('')

const coverUrl = computed(() => {
  if (props.buku?.gambar_buku) {
    return b64ToDataUrl(props.buku.gambar_buku)
  }
  return ''
})

// Reset state saat modal ditutup
watch(() => props.show, (newVal) => {
  if (!newVal) {
    setTimeout(() => {
      keterangan.value = ''
      error.value = ''
      loading.value = false
    }, 300)
  }
})

async function handleConfirm() {
  // Ambil ID peminjaman yang benar (bisa dari _id atau id_peminjaman)
  const idPeminjaman = props.peminjaman?._id || props.peminjaman?.id_peminjaman;
  
  if (!idPeminjaman) {
    error.value = 'ID peminjaman tidak valid'
    console.error('ID peminjaman tidak ditemukan:', props.peminjaman)
    return
  }

  loading.value = true
  error.value = ''

  try {
    console.log('Mengirim request ke /peminjaman/hilang dengan ID:', idPeminjaman)
    
    const res = await api('/peminjaman/hilang', { 
      method: 'POST', 
      useToken: true,
      body: { 
        id_peminjaman: idPeminjaman,
        keterangan: keterangan.value 
      } 
    })

    console.log('Response:', res)

    emit('success', {
      message: 'Buku berhasil dilaporkan hilang',
      data: res
    })

    handleClose()
  } catch (err) {
    console.error('Error in HilangModal:', err)
    error.value = err.message || 'Terjadi kesalahan'
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>