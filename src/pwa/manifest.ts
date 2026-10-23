import type { ManifestOptions } from 'vite-plugin-pwa'

/** Web app manifest of Risky, shared by the PWA build and its tests. */
export const APP_MANIFEST = {
  id: './',
  name: 'Risky',
  short_name: 'Risky',
  description: 'Jeu Risk sur plateau 3D, à jouer seul contre l’ordinateur, même hors ligne.',
  lang: 'fr',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'landscape',
  background_color: '#163b52',
  theme_color: '#10161f',
  icons: [
    { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
} satisfies Partial<ManifestOptions>
