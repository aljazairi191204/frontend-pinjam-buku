<template>
  <header class="header">
    <div class="header-inner">
      <a class="brand" :href="brandLink">
        <img src="/assets/edukarya.png" alt="Edukarya Logo" class="logo-img" />
        <span class="brand-text">{{ brandText }}</span>
      </a>
      <nav class="nav">
        <span v-if="showUser" class="badge" id="admin_user">@{{ username }}</span>
        <a v-for="link in navLinks" :key="link.to" class="btn" :class="{ primary: link.primary }" :href="link.to">{{ link.text }}</a>
        <button v-if="showLogout" class="btn danger" @click="handleLogout">Logout</button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  brandLink: { type: String, default: '/' },
  brandText: { type: String, default: 'Edukarya Library' },
  showUser: { type: Boolean, default: false },
  showLogout: { type: Boolean, default: false },
  navLinks: { type: Array, default: () => [] }
})

const emit = defineEmits(['logout'])
const authStore = useAuthStore()
const username = computed(() => authStore.username)

function handleLogout() {
  emit('logout')
}
</script>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: 0.2px;
}

.logo-img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
  flex: 0 0 auto;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.brand-text {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .logo-img {
    width: 40px;
    height: 40px;
  }
  
  .brand-text {
    font-size: 16px;
  }
}
</style>