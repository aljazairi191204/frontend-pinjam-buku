import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '.up.railway.app',  // Ini mengizinkan semua subdomain railway.app
      'frontend-pinjam-buku-production.up.railway.app' // Spesifik untuk domain Anda
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    }
  },
  preview: { // <-- TAMBAHKAN BAGIAN INI! (penting untuk production)
    port: process.env.PORT || 4173,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '.up.railway.app',
      'frontend-pinjam-buku-production.up.railway.app'
    ]
  }
})
