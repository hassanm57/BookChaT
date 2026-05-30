import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/covers': {
        target: 'http://localhost:8000',
      },
      '/pdfs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
