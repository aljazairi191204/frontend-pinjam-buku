<template>
  <div class="searchable-select" :class="{ 'is-open': isOpen }" v-click-outside="closeDropdown">
    <!-- Tombol trigger -->
    <div class="select-trigger" @click="toggleDropdown">
      <span class="selected-value" :class="{ 'placeholder': !selectedLabel }">
        {{ selectedLabel || placeholder }}
      </span>
      <span class="arrow" :class="{ 'open': isOpen }">▼</span>
    </div>

    <!-- Dropdown panel -->
    <div v-if="isOpen" class="select-dropdown">
      <!-- Input pencarian - tanpa auto-focus -->
      <div class="search-box" @click="focusSearchInput">
        <span class="search-icon">🔍</span>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Klik untuk mencari peminjam..."
          class="search-input"
          @input="handleSearchInput"
          @keydown.esc="closeDropdown"
          @keydown.up.prevent="highlightPrev"
          @keydown.down.prevent="highlightNext"
          @keydown.enter.prevent="handleEnterKey"
          @blur="onInputBlur"
        />
        <button v-if="searchQuery" class="search-clear" @click="clearSearch" @mousedown.prevent>✕</button>
      </div>

      <!-- Daftar options -->
      <div class="options-list" ref="optionsList">
        <div
          v-for="(option, index) in filteredOptions"
          :key="option.value"
          class="option-item"
          :class="{
            'selected': option.value === modelValue,
            'highlighted': index === highlightedIndex
          }"
          @click="selectOption(option)"
          @mouseenter="highlightedIndex = index"
        >
          <span class="option-label">{{ option.label }}</span>
          <span class="option-value">{{ option.value }}</span>
        </div>
        
        <!-- Empty state -->
        <div v-if="filteredOptions.length === 0" class="option-empty">
          Tidak ada peminjam ditemukan
        </div>
      </div>
      
      <!-- Petunjuk untuk mobile -->
      <div class="mobile-hint" v-if="isMobile">
        <span class="hint-text">👆 Klik untuk memasukkan pilhan nama</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Pilih peminjam...' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)
const searchInput = ref(null)
const optionsList = ref(null)
const isMobile = ref(false)

// Deteksi mobile device
onMounted(() => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

// Hitung selected label
const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : ''
})

// Filter options berdasarkan search query
const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  
  const query = searchQuery.value.toLowerCase().trim()
  return props.options.filter(option => 
    option.label.toLowerCase().includes(query) || 
    option.value.toLowerCase().includes(query)
  )
})

// Reset highlight saat filter berubah
watch(filteredOptions, () => {
  highlightedIndex.value = filteredOptions.value.length > 0 ? 0 : -1
})

// Buka/tutup dropdown - TANPA AUTO FOCUS
function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    // Reset search query saat membuka dropdown
    searchQuery.value = ''
    highlightedIndex.value = filteredOptions.value.length > 0 ? 0 : -1
    
    // JANGAN auto-focus di mobile, biarkan user klik sendiri
    if (!isMobile.value) {
      // Di desktop, kita bisa auto-focus
      nextTick(() => {
        searchInput.value?.focus()
      })
    }
  }
}

// Fungsi khusus untuk focus input saat diklik
function focusSearchInput() {
  nextTick(() => {
    searchInput.value?.focus()
  })
}

function onInputBlur() {
  // Jangan lakukan apa-apa saat blur, biarkan dropdown tetap terbuka
}

function closeDropdown() {
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1
}

// Pilih option
function selectOption(option) {
  emit('update:modelValue', option.value)
  emit('change', option)
  closeDropdown()
}

// Navigasi keyboard
function highlightPrev() {
  if (filteredOptions.value.length === 0) return
  highlightedIndex.value = highlightedIndex.value <= 0 
    ? filteredOptions.value.length - 1 
    : highlightedIndex.value - 1
  scrollToHighlighted()
}

function highlightNext() {
  if (filteredOptions.value.length === 0) return
  highlightedIndex.value = highlightedIndex.value >= filteredOptions.value.length - 1 
    ? 0 
    : highlightedIndex.value + 1
  scrollToHighlighted()
}

// Handle Enter key - MEMILIH NAMA YANG SEDANG DI-HIGHLIGHT
function handleEnterKey() {
  // Jika ada item yang di-highlight, pilih item tersebut
  if (highlightedIndex.value >= 0 && filteredOptions.value[highlightedIndex.value]) {
    selectOption(filteredOptions.value[highlightedIndex.value])
  } 
  // Jika tidak ada yang di-highlight tapi hasil filter hanya 1 item, pilih item tersebut
  else if (filteredOptions.value.length === 1) {
    selectOption(filteredOptions.value[0])
  }
  // Jika tidak ada kondisi di atas, tidak melakukan apa-apa
}

function scrollToHighlighted() {
  nextTick(() => {
    const highlighted = optionsList.value?.children[highlightedIndex.value]
    highlighted?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

function handleSearchInput() {
  highlightedIndex.value = filteredOptions.value.length > 0 ? 0 : -1
}

function clearSearch() {
  searchQuery.value = ''
  nextTick(() => {
    searchInput.value?.focus()
    highlightedIndex.value = filteredOptions.value.length > 0 ? 0 : -1
  })
}

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
    document.addEventListener('touchstart', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
    document.removeEventListener('touchstart', el.clickOutsideEvent)
  }
}
</script>

<style scoped>
/* Style sama persis dengan yang Anda berikan, tidak ada perubahan */
.searchable-select {
  position: relative;
  width: 100%;
  font-family: inherit;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 11px 12px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.select-trigger:hover {
  border-color: var(--primary);
  background: #fafafa;
}

.select-trigger:focus-within {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--focus);
}

.selected-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
}

.selected-value.placeholder {
  color: var(--muted);
  font-style: italic;
}

.arrow {
  font-size: 12px;
  color: var(--muted);
  transition: transform 0.2s ease;
  margin-left: 8px;
}

.arrow.open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 350px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-box {
  position: relative;
  padding: 8px;
  border-bottom: 1px solid var(--border);
  background: #f8fafc;
  cursor: text;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 10px 35px 10px 35px;
  border: 1px solid var(--border);
  border-radius: 30px;
  font-size: 14px;
  background: white;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: var(--focus);
}

.search-input::placeholder {
  color: #94a3b8;
  font-style: italic;
}

.search-clear {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--muted);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 2;
}

.search-clear:hover {
  background: #e2e8f0;
  color: var(--text);
}

.options-list {
  max-height: 250px;
  overflow-y: auto;
  padding: 4px;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin: 2px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item:hover {
  background: var(--primary-50);
}

.option-item.highlighted {
  background: var(--primary-50);
  border-left: 3px solid var(--primary);
}

.option-item.selected {
  background: var(--primary-50);
  color: var(--primary-600);
  font-weight: 600;
}

.option-label {
  font-size: 14px;
  color: var(--text);
  flex: 1;
}

.option-value {
  font-size: 11px;
  color: var(--muted);
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 12px;
  margin-left: 8px;
  white-space: nowrap;
}

.option-empty {
  padding: 20px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  font-style: italic;
}

.mobile-hint {
  padding: 8px 12px;
  background: #f0f9ff;
  border-top: 1px solid #bae6fd;
  text-align: center;
  font-size: 12px;
  color: #0369a1;
}

.hint-text {
  display: inline-block;
  padding: 4px 8px;
}

/* Scrollbar styling */
.options-list::-webkit-scrollbar {
  width: 6px;
}

.options-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.options-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.options-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive */
@media (max-width: 640px) {
  .select-dropdown {
    max-height: 300px;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 400px;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translate(-50%, -40%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  
  .options-list {
    max-height: 200px;
  }
  
  .option-item {
    padding: 12px 10px;
  }
  
  .search-input {
    font-size: 16px;
    padding: 12px 40px 12px 40px;
  }
  
  .mobile-hint {
    padding: 10px;
    font-size: 13px;
  }
}
</style>