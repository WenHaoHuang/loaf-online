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
    proxy: {}
  },
  build: {
    outDir: '../client/resources',
    emptyOutDir: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        charset: false
      }
    }
  }
})
