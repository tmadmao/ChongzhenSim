import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const wasmSrc = path.join(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm')
const wasmDest = path.join(__dirname, 'public/sql-wasm.wasm')
if (fs.existsSync(wasmSrc) && !fs.existsSync(wasmDest)) {
  fs.copyFileSync(wasmSrc, wasmDest)
  console.log('[vite.config] Copied sql-wasm.wasm to public/')
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@store': path.resolve(__dirname, './src/store'),
      '@db': path.resolve(__dirname, './src/db'),
      '@components': path.resolve(__dirname, './src/components'),
      '@api': path.resolve(__dirname, './src/api'),
      '@data': path.resolve(__dirname, './src/data'),
    },
  },
  optimizeDeps: {
    exclude: ['sql.js'],
    include: ['leaflet'],
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    target: 'esnext',
  },
})
