<template>
  <div class="modal-backdrop" :class="{ show: show }" @click.self="handleClose">
    <div class="modal large" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 class="modal-title">Konfirmasi Pengembalian</h3>
        <button class="btn close-btn" type="button" @click="handleClose">Tutup</button>
      </div>

      <div class="modal-body">
        <!-- Banner error di dalam modal -->
        <div v-if="banner.show" class="banner-error" :class="banner.type">
          <span class="banner-icon">⚠️</span>
          <span class="banner-message">{{ banner.message }}</span>
        </div>

        <div class="helper" style="margin-bottom:10px">
          Pastikan data berikut benar sebelum memproses.
        </div>

        <div class="card" style="box-shadow:none; border:1px solid rgba(226,232,240,.9)">
          <div class="card-body" style="padding:12px">
            <div class="field" style="margin:0">
              <label>Nama Peminjam</label>
              <input :value="loan?.nama_peminjam || '-'" disabled />
            </div>

            <div class="field" style="margin-top:10px">
              <label>Tanggal Pinjam</label>
              <input :value="fmtDateTime(loan?.tanggal_pinjam)" disabled />
            </div>
          </div>
        </div>

        <!-- Camera Section with vue-camera-lib -->
        <div class="camera-section" style="margin-top: 16px;">
          <label style="font-weight: bold; margin-bottom: 8px; display: block;">
            📸 Bukti Pengembalian (Foto)
          </label>
          
          <!-- Hasil Foto -->
          <div v-if="capturedImage" class="captured-preview">
            <img 
              :src="capturedImage" 
              alt="Bukti pengembalian" 
              style="width: 100%; max-height: 300px; object-fit: contain; border-radius: 12px; border: 2px solid var(--primary); background: #f8fafc;"
            />
            <div class="preview-controls" style="display: flex; gap: 10px; margin-top: 10px; justify-content: center;">
              <button class="btn" @click="retakePhoto">📷 Ambil Ulang</button>
              <button class="btn danger" @click="removePhoto">🗑️ Hapus</button>
            </div>
          </div>

          <!-- Camera UI -->
          <div v-else>
            <!-- Gunakan komponen WebCamUI dari library -->
            <WebCamUI 
              v-if="showCamera"
              ref="webcamUI"
              :fullscreenState="false"
              :takePhotoButton="{ display: true, text: '📸 Ambil Foto', css: 'btn primary' }"
              :fullscreenButton="{ display: false }"
              :reloadCamerasButton="{ display: true, text: '🔄 Reload Kamera', css: 'btn' }"
              :selectCameraLabel="'Pilih kamera...'"
              @photoTaken="onPhotoTaken"
              @error="onCameraError"
              @unsupported="onCameraUnsupported"
              @init="onCameraInit"
              class="camera-container"
            />
            
            <!-- Loading state -->
            <div v-if="cameraLoading" class="camera-loading">
              <div class="spinner"></div>
              <p>Menyiapkan kamera...</p>
            </div>
            
            <!-- Error message -->
            <div v-if="cameraError" class="alert error show">
              <strong>Error:</strong> {{ cameraError }}
              <button class="btn" @click="retryCamera" style="margin-top: 8px;">Coba Lagi</button>
            </div>
            
            <!-- Manual start button jika autoStart gagal -->
            <div v-if="!showCamera && !cameraError && !capturedImage" class="camera-placeholder">
              <button class="btn primary" @click="startCameraManual">
                📷 Buka Kamera
              </button>
              <p class="helper" style="margin-top: 8px;">
                Klik tombol di atas untuk membuka kamera
              </p>
            </div>
          </div>

          <!-- Tips untuk mobile -->
          <div v-if="isMobile && !cameraError && !capturedImage" class="alert info" style="margin-top: 10px;">
            <strong>📱 Tips Mobile:</strong>
            <ul style="margin-top: 4px; margin-bottom: 0; padding-left: 20px;">
              <li>Pastikan memberikan izin kamera saat diminta</li>
              <li>Jika kamera tidak muncul, reload halaman</li>
              <li>Pilih kamera belakang untuk hasil lebih baik</li>
            </ul>
          </div>
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; margin-top:12px">
          <button class="btn cancel-btn" type="button" @click="handleClose">Batal</button>
          <button 
            class="btn primary" 
            type="button" 
            @click="handleReturn" 
            :disabled="loading || !capturedImageRaw"
          >
            {{ loading ? 'Memproses...' : 'Ya, Kembalikan' }}
          </button>
        </div>
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
import { ref, watch, onMounted, onUnmounted, nextTick, reactive } from 'vue' // <-- SUDAH BENAR
import { useApi } from '../composables/useApi'
import { useDateTime } from '../composables/useDateTime'
import AlertModal from './AlertModal.vue'
import { WebCamUI } from 'vue-camera-lib'

const props = defineProps({
  show: { type: Boolean, default: false },
  loan: { type: Object, default: null }
})

const emit = defineEmits(['close', 'success'])

const { api } = useApi()
const { fmtDateTime } = useDateTime()
const loading = ref(false)

// State untuk AlertModal
const showAlert = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')
const alertType = ref('success')

// State untuk banner error - PAKAI REACTIVE
const banner = reactive({
  show: false,
  type: '',
  message: ''
})

// Camera state dengan vue-camera-lib
const webcamUI = ref(null)
const showCamera = ref(false)
const cameraLoading = ref(false)
const cameraError = ref('')
const capturedImage = ref('')
const capturedImageRaw = ref('')

// Deteksi mobile
const isMobile = ref(false)

// Timer untuk banner
let bannerTimer = null

// Reset state
function resetState() {
  loading.value = false
  stopCamera()
  capturedImage.value = ''
  capturedImageRaw.value = ''
  cameraError.value = ''
  showCamera.value = false
  hideBanner()
}

function showErrorBanner(message) {
  if (bannerTimer) clearTimeout(bannerTimer)
  banner.show = true
  banner.type = 'error'
  banner.message = message
  bannerTimer = setTimeout(() => {
    banner.show = false
    bannerTimer = null
  }, 3000)
}

function hideBanner() {
  if (bannerTimer) {
    clearTimeout(bannerTimer)
    bannerTimer = null
  }
  banner.show = false
}

function showAlertMessage(type, title, message) {
  alertType.value = type
  alertTitle.value = title
  alertMessage.value = message
  showAlert.value = true
}

function closeAlert() {
  showAlert.value = false
}

// Camera functions dengan vue-camera-lib
function startCameraManual() {
  cameraError.value = ''
  cameraLoading.value = true
  showCamera.value = true
  
  // Library akan auto-start, kita hanya perlu menampilkan komponen
  setTimeout(() => {
    cameraLoading.value = false
  }, 1000)
}

function stopCamera() {
  if (webcamUI.value) {
    try {
      webcamUI.value.stop()
    } catch (err) {
      console.log('Stop camera error:', err)
    }
  }
  showCamera.value = false
}

function retryCamera() {
  cameraError.value = ''
  showCamera.value = false
  nextTick(() => {
    startCameraManual()
  })
}

function onPhotoTaken(data) {
  // data = { blob, image_data_url }
  console.log('Photo taken:', data)
  
  if (data && data.image_data_url) {
    capturedImage.value = data.image_data_url
    // Ambil base64 tanpa prefix data:image/jpeg;base64,
    capturedImageRaw.value = data.image_data_url.split(',')[1]
    stopCamera()
    hideBanner()
  } else {
    cameraError.value = 'Gagal mengambil foto'
  }
}

function onCameraError(error) {
  console.error('Camera error:', error)
  cameraError.value = error || 'Gagal mengakses kamera'
  cameraLoading.value = false
  showCamera.value = false
}

function onCameraUnsupported(message) {
  console.error('Camera unsupported:', message)
  cameraError.value = 'Browser tidak mendukung kamera'
  cameraLoading.value = false
  showCamera.value = false
}

function onCameraInit(deviceId) {
  console.log('Camera initialized with device:', deviceId)
  cameraLoading.value = false
}

function retakePhoto() {
  capturedImage.value = ''
  capturedImageRaw.value = ''
  startCameraManual()
}

function removePhoto() {
  capturedImage.value = ''
  capturedImageRaw.value = ''
}

// Handle return
async function handleReturn() {
  if (!capturedImageRaw.value) {
    showErrorBanner('Foto dulu bersama Buku untuk bukti pengembalian')
    return
  }

  if (!props.loan?.id_peminjaman) {
    showAlertMessage('error', 'Error', 'ID peminjaman tidak valid.')
    return
  }

  loading.value = true
  try {
    const res = await api('/peminjaman/kembali', { 
      method: 'POST', 
      body: { 
        id_peminjaman: props.loan.id_peminjaman,
        bukti_pengembalian: capturedImageRaw.value 
      } 
    })

    const status = res?.status_pengembalian || ''
    const isOk = status.includes('tepat')

    emit('success', {
      type: isOk ? 'ok' : 'late',
      title: isOk ? 'Mengembalikan Tepat Waktu' : 'Terlambat Mengembalikan',
      sub: `Peminjam: ${props.loan.nama_peminjam} • Tanggal pengembalian: ${fmtDateTime(new Date())}`
    })

    handleClose()
  } catch (err) {
    console.error('Error in handleReturn:', err)
    showAlertMessage('error', 'Gagal', err.message)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  resetState()
  emit('close')
}

// Watch untuk reset saat modal ditutup/dibuka
watch(() => props.show, (newVal) => {
  if (!newVal) {
    resetState()
  } else {
    hideBanner()
    // Auto start camera saat modal dibuka
    nextTick(() => {
      startCameraManual()
    })
  }
})

// Cleanup
onUnmounted(() => {
  stopCamera()
  if (bannerTimer) clearTimeout(bannerTimer)
})

// Deteksi mobile
onMounted(() => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})
</script>

<style scoped>
.camera-section {
  border-top: 1px solid var(--border);
  padding-top: 16px;
  margin-top: 16px;
}

.camera-container {
  width: 100%;
  min-height: 300px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: #f8fafc;
}

.camera-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed var(--border);
}

.camera-placeholder {
  text-align: center;
  padding: 40px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed var(--border);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.captured-preview {
  text-align: center;
}

.captured-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  border: 2px solid var(--primary);
  background: #f8fafc;
}

.preview-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.banner-error {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: slideIn 0.3s ease;
}

.banner-error.error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.banner-icon {
  font-size: 20px;
}

.banner-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
}

.alert.error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.alert.info {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #0050b3;
}

.alert ul {
  margin-top: 6px;
  margin-bottom: 0;
  padding-left: 20px;
}

/* Override style untuk komponen camera library */
:deep(.web-cam-ui) {
  width: 100% !important;
  border-radius: 12px !important;
}

:deep(.web-cam-ui video) {
  width: 100% !important;
  max-height: 300px !important;
  object-fit: cover !important;
  border-radius: 12px !important;
}

:deep(.web-cam-ui .controls) {
  padding: 12px !important;
  background: rgba(0,0,0,0.05) !important;
  border-radius: 0 0 12px 12px !important;
}

:deep(.web-cam-ui select) {
  padding: 8px !important;
  border-radius: 8px !important;
  border: 1px solid var(--border) !important;
  background: white !important;
  margin: 0 8px !important;
}

@media (max-width: 640px) {
  .camera-controls, .preview-controls {
    flex-direction: column;
  }
  
  .camera-controls button, .preview-controls button {
    width: 100%;
  }
  
  :deep(.web-cam-ui .controls) {
    flex-direction: column !important;
    gap: 8px !important;
  }
  
  :deep(.web-cam-ui select) {
    width: 100% !important;
    margin: 4px 0 !important;
  }
  
  .alert {
    font-size: 12px;
    padding: 10px 12px;
  }
}
</style>