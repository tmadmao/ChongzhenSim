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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 相关
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-is')) {
            return 'react-vendor';
          }
          // UI 库
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet') || id.includes('node_modules/echarts') || id.includes('node_modules/recharts')) {
            return 'ui-vendor';
          }
          // 数据库相关
          if (id.includes('node_modules/sql.js')) {
            return 'sql-wasm';
          }
          // AI 和 API 相关
          if (id.includes('node_modules/ai') || id.includes('node_modules/@ai-sdk') || id.includes('src/api/')) {
            return 'ai-api';
          }
          // 地图相关组件
          if (id.includes('src/components/map/')) {
            return 'map-components';
          }
          // 面板组件
          if (id.includes('src/components/panels/') || id.includes('src/components/province/') || id.includes('src/components/finance/') || id.includes('src/components/log/')) {
            return 'panel-components';
          }
          // 事件和大臣相关
          if (id.includes('src/components/event/') || id.includes('src/components/minister/') || id.includes('src/components/decree/')) {
            return 'event-components';
          }
          // 数据和配置
          if (id.includes('src/data/') || id.includes('src/config/')) {
            return 'data-config';
          }
          // 存储和系统
          if (id.includes('src/store/') || id.includes('src/systems/') || id.includes('src/core/')) {
            return 'store-systems';
          }
        },
      },
    },
  },
})
