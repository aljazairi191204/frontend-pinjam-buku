export default {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000,
  },

  app: {
    name: import.meta.env.VITE_APP_NAME || 'Edukarya Library',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || 'id',
  },

  session: {
    timeoutMinutes: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES) || 480,
    get timeoutMs() {
      return this.timeoutMinutes * 60 * 1000;
    },
    get timeoutDisplay() {
      const hours = Math.floor(this.timeoutMinutes / 60);
      const minutes = this.timeoutMinutes % 60;
      return minutes > 0 ? `${hours} jam ${minutes} menit` : `${hours} jam`;
    },
  },

  ui: {
    itemsPerPage: [5, 10, 20, 50],
    defaultItemsPerPage: 10,
    maxVisiblePages: 7,
  },

  search: {
    fuzzyModeDefault: true,
    fuzzyThreshold: 0.6,
    minQueryLength: 2,
    debounceTime: 300,
    suggestions: {
      enabled: true,
      maxSuggestions: 5,
      minWordLength: 3,
    }
  },

  upload: {
    maxSizeMB: 8,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    imageQuality: 0.9,
  },

  loanRules: {
    maxLoanDays: 14,
    maxBooksPerPerson: null,
  },

  // KONFIGURASI KAMERA DITAMBAHKAN
  camera: {
    defaultFacingMode: 'environment', // 'environment' = belakang, 'user' = depan
    videoConstraints: {
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    supportedModes: ['environment', 'user'],
    library: 'vue-camera-lib', // <-- TAMBAHKAN INI
  },

  features: {
    enableFuzzySearch: true,
    enableCamera: true,
    enablePagination: true,
  },

  routes: {
    home: '/',
    adminLogin: '/admin/login',
    adminDashboard: '/admin/dashboard',
    adminPeminjam: '/admin/peminjam',
  },

  messages: {
    loading: 'Memuat data...',
    noData: 'Tidak ada data',
    error: 'Terjadi kesalahan',
    success: 'Berhasil',
    sessionExpired: (minutes) => `Sesi anda telah berakhir karena tidak ada aktivitas selama ${minutes} menit.`,
  },

  alertModal: {
    titles: {
      success: 'Berhasil',
      error: 'Gagal',
      warning: 'Peringatan',
      info: 'Informasi',
      confirm: 'Konfirmasi',
    },
    buttons: {
      confirm: 'OK',
      cancel: 'Batal',
      yes: 'Ya',
      no: 'Tidak',
    }
  },
};