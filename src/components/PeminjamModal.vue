<template>
  <div class="modal-backdrop" :class="{ show: show }" @click.self="handleClose">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="btn close-btn" type="button" @click="handleClose">Tutup</button>
      </div>
      <div class="modal-body">
        <form class="form" @submit.prevent="handleSubmit">
          <div class="field">
            <label for="p_nama">Nama Peminjam</label>
            <input id="p_nama" v-model="form.nama_peminjam" placeholder="Nama lengkap" />
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
import AlertModal from './AlertModal.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  title: { type: String, default: 'Tambah Peminjam' },
  initial: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'success'])

const { api } = useApi()
const loading = ref(false)

const showAlert = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')
const alertType = ref('success')

const form = reactive({
  id_peminjam: '',
  nama_peminjam: ''
})

function resetForm() {
  form.id_peminjam = props.mode === 'edit' ? props.initial?.id_peminjam || '' : ''
  form.nama_peminjam = props.mode === 'edit' ? props.initial?.nama_peminjam || '' : ''
}

watch(() => props.initial, (val) => {
  if (props.mode === 'edit' && val) {
    resetForm()
  }
}, { immediate: true, deep: true })

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

async function handleSubmit() {
  if (!form.nama_peminjam) {
    showAlertMessage('error', 'Error', 'Nama peminjam wajib diisi.')
    return
  }

  loading.value = true
  try {
    if (props.mode === 'create') {
      await api('/peminjam', { 
        method: 'POST', 
        useToken: true,
        body: { nama_peminjam: form.nama_peminjam } 
      })
      emit('success', 'Peminjam berhasil ditambahkan.')
    } else {
      await api(`/peminjam/${encodeURIComponent(form.id_peminjam)}`, { 
        method: 'PUT', 
        useToken: true,
        body: { nama_peminjam: form.nama_peminjam } 
      })
      emit('success', 'Peminjam berhasil diupdate.')
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