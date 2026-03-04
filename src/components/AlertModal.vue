<template>
  <div class="modal-backdrop" :class="{ show: show }" @click.self="handleClose">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="btn close-btn" type="button" @click="handleClose">Tutup</button>
      </div>
      <div class="modal-body">
        <div class="helper" style="margin-bottom:12px; white-space: pre-line;">
          {{ message }}
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap">
          <button 
            v-if="type === 'confirm'" 
            class="btn cancel-btn" 
            type="button" 
            @click="handleCancel"
          >
            Batal
          </button>
          <button 
            class="btn" 
            :class="buttonClass" 
            type="button" 
            @click="handleConfirm"
            :disabled="loading"
          >
            {{ loading ? 'Memproses...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  type: { type: String, default: 'alert' },
  title: { type: String, default: 'Informasi' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'OK' },
  cancelText: { type: String, default: 'Batal' },
  buttonType: { type: String, default: 'primary' }
})

const emit = defineEmits(['close', 'confirm', 'cancel'])
const loading = ref(false)

watch(() => props.show, (newVal) => {
  if (!newVal) {
    loading.value = false
  }
})

const buttonClass = computed(() => {
  if (props.buttonType === 'danger') return 'danger'
  if (props.buttonType === 'success') return 'primary'
  return 'primary'
})

function handleClose() {
  emit('close')
}

function handleCancel() {
  emit('cancel')
  emit('close')
}

async function handleConfirm() {
  if (props.type === 'confirm') {
    loading.value = true
    try {
      await emit('confirm')
    } finally {
      loading.value = false
    }
  } else {
    emit('confirm')
    emit('close')
  }
}
</script>