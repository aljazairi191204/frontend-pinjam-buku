<template>
  <div class="modal-backdrop" :class="{ show: show }" @click.self="handleClose">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">Konfirmasi</h3>
        <button class="btn close-btn" type="button" @click="handleClose">Tutup</button>
      </div>
      <div class="modal-body">
        <div class="helper" style="margin-bottom:12px">
          Apakah anda yakin akan menghapus semua data peminjaman?
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap">
          <button class="btn cancel-btn" type="button" @click="handleClose">Batal</button>
          <button class="btn danger" type="button" @click="handleConfirm" :disabled="loading">Ya</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useApi } from '../composables/useApi'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'confirm'])

const { api } = useApi()
const loading = ref(false)

watch(() => props.show, (newVal) => {
  if (!newVal) {
    loading.value = false
  }
})

async function handleConfirm() {
  loading.value = true
  try {
    await api('/peminjaman/admin', { method: 'DELETE', useToken: true })
    emit('confirm', 'Semua data peminjaman berhasil dihapus.')
    handleClose()
  } catch (err) {
    alert(`Gagal menghapus: ${err.message}`)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  loading.value = false
  emit('close')
}
</script>