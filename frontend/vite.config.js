import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2020',
    outDir: './dist'
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.3815147.ip-ddns.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
