import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const pathResolve = (dir: string): string => {
  return resolve(__dirname, '.', dir)
}

const alias: Record<string, string> = {
  '@': pathResolve('src')
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias
  },
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        charset: false
      }
    }
  }
})
