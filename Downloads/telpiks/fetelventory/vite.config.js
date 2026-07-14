import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Semua request /api diteruskan ke backend FastAPI (lihat folder
      // kptel_backend/, jalankan dengan: uvicorn app.main:app --port 8787).
      // Ubah VITE_BACKEND_URL di file .env bila backend berjalan di host/port lain.
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
