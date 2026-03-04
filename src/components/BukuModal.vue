<template>
  <div class="modal-backdrop" :class="{ show: show }" @click.self="handleClose">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="btn close-btn" type="button" @click="handleClose">Tutup</button>
      </div>
      <div class="modal-body">
        <form class="form" @submit.prevent="handleSubmit">
          <div class="row">
            <div class="field">
              <label for="m_id_buku">ID Buku</label>
              <input id="m_id_buku" v-model="form.id_buku" :disabled="mode === 'edit'" placeholder="BK001" />
            </div>
            <div class="field">
              <label for="m_jumlah">Stok</label>
              <input id="m_jumlah" v-model.number="form.jumlah" type="number" min="0" />
            </div>
          </div>

          <div class="field">
            <label for="m_nama_buku">Nama Buku</label>
            <input id="m_nama_buku" v-model="form.nama_buku" placeholder="Judul buku" />
          </div>

          <div class="field">
            <label for="m_penulis_buku">Penulis</label>
            <input id="m_penulis_buku" v-model="form.penulis_buku" placeholder="Nama penulis" />
          </div>

          <div class="field">
            <label for="m_gambar_file">Gambar Buku (Base64)</label>
            <input 
              id="m_gambar_file" 
              type="file" 
              accept="image/*" 
              @change="handleFileChange" 
              ref="fileInput"
            />
            <div class="helper">
              Pilih gambar dari komputer. Akan diubah jadi Base64 string RAW (bukan fakepath).
            </div>
            <img v-if="previewUrl" :src="previewUrl" class="img-preview" style="display:block; max-width:200px; margin-top:10px" alt="Preview gambar buku">
            <button 
              v-if="previewUrl" 
              type="button" 
              class="btn" 
              @click="removeImage" 
              style="margin-top:8px"
            >
              Hapus Gambar
            </button>
          </div>

          <button class="btn primary" type="submit" :disabled="loading">Simpan</button>
        </form>
      </div>
    </div>
  </div>

  <AlertModal
    :show="showAlert"
    :type="alertType"
    :title="alertTitle"
    :message="alertMessage"
    :button-type="alertType === 'error' ? 'danger' : 'success'"
    @close="closeAlert"
    @confirm="closeAlert"
  />
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useApi } from '../composables/useApi'
import { useBase64 } from '../composables/useBase64'
import AlertModal from './AlertModal.vue'
import config from '../config/app.config'

const props = defineProps({
  show: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  title: { type: String, default: 'Tambah Buku' },
  initial: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'success'])

const { api } = useApi()
const { b64ToDataUrl, fileToBase64Raw } = useBase64()
const loading = ref(false)

const showAlert = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')
const alertType = ref('success')

const previewUrl = ref('')
const fileInput = ref(null)

const form = reactive({
  id_buku: '',
  nama_buku: '',
  penulis_buku: '',
  jumlah: 1,
  gambar_buku: ''
})

function resetForm() {
  form.id_buku = props.mode === 'edit' ? props.initial?.id_buku || '' : ''
  form.nama_buku = props.mode === 'edit' ? props.initial?.nama_buku || '' : ''
  form.penulis_buku = props.mode === 'edit' ? props.initial?.penulis_buku || '' : ''
  form.jumlah = props.mode === 'edit' ? (props.initial?.jumlah ?? 1) : 1
  form.gambar_buku = props.mode === 'edit' ? (props.initial?.gambar_buku || '') : ''
  previewUrl.value = form.gambar_buku ? b64ToDataUrl(form.gambar_buku) : ''
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

watch(() => props.initial, (val) => {
  if (props.mode === 'edit' && val) {
    resetForm()
  }
}, { deep: true })

watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

function showAlertMessage(type, title, message) {
  alertType.value = type
  alertTitle.value = title
  alertMessage.value = message
  showAlert.value = true
}

function closeAlert() {
  showAlert.value = false
}

function removeImage() {
  form.gambar_buku = ''
  previewUrl.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showAlertMessage('error', 'Error', 'File harus berupa gambar.')
    e.target.value = ''
    return
  }

  const mb = file.size / (1024 * 1024)
  if (mb > config.upload.maxSizeMB) {
    showAlertMessage('error', 'Error', `Ukuran gambar terlalu besar (${mb.toFixed(1)}MB). Maksimal ${config.upload.maxSizeMB}MB.`)
    e.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)

  form.gambar_buku = await fileToBase64Raw(file)
}

async function handleSubmit() {
  if (!form.id_buku && props.mode === 'create') {
    showAlertMessage('error', 'Error', 'ID Buku wajib diisi.')
    return
  }
  if (!form.nama_buku) {
    showAlertMessage('error', 'Error', 'Nama buku wajib diisi.')
    return
  }
  if (!form.penulis_buku) {
    showAlertMessage('error', 'Error', 'Penulis buku wajib diisi.')
    return
  }
  if (form.jumlah === '' || form.jumlah === null || isNaN(form.jumlah)) {
    showAlertMessage('error', 'Error', 'Stok buku wajib diisi.')
    return
  }

  loading.value = true
  try {
    if (props.mode === 'create') {
      await api('/buku', { 
        method: 'POST', 
        useToken: true,
        body: { 
          id_buku: form.id_buku, 
          nama_buku: form.nama_buku, 
          penulis_buku: form.penulis_buku, 
          jumlah: form.jumlah, 
          gambar_buku: form.gambar_buku 
        } 
      })
      emit('success', 'Buku berhasil ditambahkan.')
    } else {
      await api(`/buku/${encodeURIComponent(form.id_buku)}`, { 
        method: 'PUT', 
        useToken: true,
        body: { 
          nama_buku: form.nama_buku, 
          penulis_buku: form.penulis_buku, 
          jumlah: form.jumlah, 
          gambar_buku: form.gambar_buku 
        } 
      })
      emit('success', 'Buku berhasil diupdate.')
    }

    resetForm()
    emit('close')
  } catch (err) {
    showAlertMessage('error', 'Gagal', err.message)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  resetForm()
  emit('close')
}
</script>