import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { externalizeDepsPlugin } from 'electron-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), externalizeDepsPlugin()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron'],
      input: {
        main: resolve(__dirname, 'index.html'),
        overlay: resolve(__dirname, 'overlay.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true
  },
  optimizeDeps: {
    exclude: ['electron']
  }
})