```markdown
# Frontend Pinjam Buku - Perpustakaan Edukarya

Frontend untuk sistem manajemen peminjaman buku perpustakaan Edukarya. Dibangun dengan Vue 3, Vite, dan Pinia. Terintegrasi dengan backend API untuk pengelolaan buku, peminjam, dan peminjaman.

## ✨ Fitur Utama

### Publik (Semua Pengguna)
- 📚 **Lihat Daftar Buku** - Menampilkan semua buku dengan status ketersediaan
- 🔍 **Pencarian Cerdas** - Pencarian fuzzy (toleransi typo) untuk judul dan penulis
- 📖 **Pinjam Buku** - Meminjam buku dengan memilih peminjam dari daftar
- 📸 **Preview Cover** - Melihat gambar cover buku dengan klik
- 📱 **Responsive Design** - Tampilan optimal di desktop, tablet, dan mobile
- 📊 **Pagination** - Navigasi halaman yang mudah
- 👥 **Lihat Peminjam Aktif** - Melihat siapa saja yang sedang meminjam buku tertentu

### Admin (Login Required)
- 🔐 **Login Admin** - Autentikasi dengan JWT
- 📊 **Dashboard Admin**:
  - **Kelola Buku (CRUD)** - Tambah, edit, hapus, dan lihat buku
  - **Kelola Peminjam (CRUD)** - Tambah, edit, hapus, dan lihat data peminjam
  - **Riwayat Peminjaman** - Lihat semua transaksi peminjaman
  - **Laporan Buku Hilang** - Melaporkan buku yang hilang
  - **Preview Bukti** - Melihat foto bukti pengembalian
- ⏱️ **Session Timeout** - Logout otomatis setelah tidak ada aktivitas

### Fitur Khusus
- 🎯 **Pencarian Fuzzy** - Toleransi typo dalam pencarian (misal: "umayah" menemukan "umayyah")
- 📸 **Camera Integration** - Mengambil foto bukti pengembalian dengan kamera (vue-camera-lib)
- 🏷️ **Status Visual** - Badge warna untuk status buku dan peminjaman
- 🔄 **Sorting** - Sortir buku berdasarkan nama dan stok
- 📱 **Mobile Friendly** - UI responsif dengan touch targets yang besar
- 🎨 **Modern UI** - Desain modern dengan CSS variables dan glassmorphism

## 🛠️ Teknologi

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Fetch API dengan interceptors
- **Camera**: vue-camera-lib
- **Styling**: CSS3 dengan Custom Properties
- **Icons**: Emoji dan karakter Unicode
- **Lainnya**: 
  - Date formatting
  - Base64 encoding/decoding
  - Fuzzy search algorithms
  - Session management

## 📋 Prasyarat

- Node.js (v16 atau lebih baru)
- npm atau yarn atau pnpm
- Backend API running (https://github.com/aljazairi191204/backend-pinjam-buku)

## 🚀 Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/aljazairi191204/frontend-pinjam-buku.git
   cd frontend-pinjam-buku
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Buat file environment**
   ```bash
   cp .env.example .env
   ```

4. **Edit file `.env`** sesuai konfigurasi Anda
   ```env
   VITE_API_BASE_URL=/api
   VITE_APP_NAME=Edukarya Library
   VITE_APP_VERSION=1.0.0
   VITE_DEFAULT_LANGUAGE=id
   VITE_SESSION_TIMEOUT_MINUTES=480
   ```

5. **Jalankan aplikasi**
   ```bash
   npm run dev
   ```

## 📁 Struktur Folder

```
frontend-pinjam-buku/
├── public/
│   └── assets/
│       ├── background.png
│       ├── banner.png
│       ├── banner@2x.png
│       └── edukarya.png
├── src/
│   ├── assets/
│   │   └── app.css
│   ├── components/
│   │   ├── AlertModal.vue
│   │   ├── BookCard.vue
│   │   ├── BorrowModal.vue
│   │   ├── BukuModal.vue
│   │   ├── ClearPinjamModal.vue
│   │   ├── Header.vue
│   │   ├── HilangModal.vue
│   │   ├── LoanListModal.vue
│   │   ├── PeminjamModal.vue
│   │   ├── ReturnModal.vue
│   │   └── SearchableSelect.vue
│   ├── composables/
│   │   ├── useApi.js
│   │   ├── useBase64.js
│   │   ├── useDateTime.js
│   │   ├── useSearch.js
│   │   └── useSessionTimeout.js
│   ├── config/
│   │   └── app.config.js
│   ├── router/
│   │   └── index.js
│   ├── stores/
│   │   └── auth.js
│   ├── views/
│   │   ├── AdminDashboardView.vue
│   │   ├── AdminLoginView.vue
│   │   ├── AdminPeminjamView.vue
│   │   └── HomeView.vue
│   ├── App.vue
│   └── main.js
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

## 🔌 Integrasi dengan Backend

Frontend ini dirancang untuk bekerja dengan backend API yang berjalan di `http://localhost:5000`. Konfigurasi proxy di `vite.config.js`:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  }
}
```

## 📱 Halaman & Fungsionalitas

### Halaman Publik (`/`)
- Menampilkan semua buku
- Pencarian fuzzy dengan debounce
- Sortir berdasarkan nama/stok
- Pagination
- Preview cover buku
- Pinjam buku
- Lihat daftar peminjam aktif per buku

### Halaman Login Admin (`/admin/login`)
- Form login dengan validasi
- Banner error/success
- Redirect setelah login sukses

### Dashboard Admin (`/admin/dashboard`)
- Tab Kelola Buku: CRUD buku dengan form, pencarian fuzzy, pagination
- Tab Data Peminjaman: Riwayat semua peminjaman, status badge, preview bukti, lapor buku hilang

### Halaman Kelola Peminjam (`/admin/peminjam`)
- CRUD peminjam
- ID auto-generated
- Pencarian fuzzy
- Validasi sebelum hapus

## 🎯 Fitur Pencarian Fuzzy

Pencarian cerdas yang dapat menemukan kata meskipun ada typo:
- Toleransi typo
- Relevance scoring
- Saran kata yang mirip
- Mode ON/OFF

## 📸 Fitur Kamera

Menggunakan `vue-camera-lib` untuk mengambil foto bukti pengembalian:
- Auto-detect kamera
- Pilih kamera depan/belakang
- Mobile friendly
- Preview dan retake

## 🔒 Session Management

- Logout otomatis setelah 8 jam (configurable)
- Reset timer setiap ada aktivitas
- Token disimpan di localStorage
- Auto-logout jika 401/403

## 🎨 Styling & UI

- CSS Variables untuk kustomisasi mudah
- Glassmorphism effect
- Responsive mobile-first design
- Touch friendly (target 44px)
- Badges dengan warna berbeda per status

## 🌐 Environment Variables

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `VITE_API_BASE_URL` | Base URL untuk API | /api |
| `VITE_APP_NAME` | Nama aplikasi | Edukarya Library |
| `VITE_APP_VERSION` | Versi aplikasi | 1.0.0 |
| `VITE_DEFAULT_LANGUAGE` | Bahasa default | id |
| `VITE_SESSION_TIMEOUT_MINUTES` | Timeout session (menit) | 480 |

## 🚦 Menjalankan dengan Backend

1. Jalankan backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Jalankan frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Akses aplikasi:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## 📝 Catatan Penggunaan

1. **Login Admin**: Gunakan kredensial dari database (register via API)
2. **Peminjaman Buku**: Pilih buku → klik Pinjam → cari peminjam → konfirmasi
3. **Pengembalian Buku**: Buka daftar peminjam → klik Kembalikan → ambil foto → konfirmasi
4. **Buku Hilang**: Admin → tab Data Peminjaman → klik Hilang → isi keterangan → konfirmasi

## 🤝 Kontribusi

Silakan fork repository ini dan buat pull request untuk kontribusi.

## 📄 Lisensi

MIT License

## 📞 Kontak

- **GitHub**: [@aljazairi191204](https://github.com/aljazairi191204)
- **Email**: aljazairi191204@gmail.com

---
**Dibangun untuk Perpustakaan Edukarya**
```
