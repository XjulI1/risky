import tailwindcss from '@tailwindcss/vite'
import { templateCompilerOptions } from '@tresjs/core'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_MANIFEST } from './src/pwa/manifest.ts'

const THREE_BUNDLE_LIMIT_KB = 1600
const PRECACHE_FILE_LIMIT_BYTES = 4 * 1024 * 1024

export default defineConfig({
  plugins: [
    vue({ ...templateCompilerOptions }),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: APP_MANIFEST,
      includeManifestIcons: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        maximumFileSizeToCacheInBytes: PRECACHE_FILE_LIMIT_BYTES,
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    chunkSizeWarningLimit: THREE_BUNDLE_LIMIT_KB,
  },
})
