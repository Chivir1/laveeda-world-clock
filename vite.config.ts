import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  // The sandbox/preview server proxies by hostname; allow any host so the
  // live preview and any tunnel work without config.
  const allowAnyHost = true
  // A service worker that owns navigation caching makes hot previews stale.
  // Production builds get the full offline shell; set SW_OFF=1 to opt out.
  const offlineShell = env.SW_OFF !== '1'

  return {
    base: env.VITE_BASE || '/',
    server: { host: '0.0.0.0', port: 5173, strictPort: false, allowedHosts: allowAnyHost ? true : [] },
    preview: { host: '0.0.0.0', port: 4173, allowedHosts: allowAnyHost ? true : [] },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: [
          'icons/favicon.svg',
          'icons/apple-touch-icon.png',
          'icons/maskable-icon.png',
        ],
        manifest: {
          id: '/',
          name: 'Laveeda — World Clock & Time Zones',
          short_name: 'Laveeda',
          description:
            'Live time for every city and every time zone on Earth. Compare working hours, find the right moment to meet, and install it on your phone.',
          lang: 'en',
          dir: 'ltr',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'any',
          categories: ['utilities', 'productivity', 'travel', 'lifestyle'],
          background_color: '#070a13',
          theme_color: '#070a13',
          scope: './',
          start_url: './',
          shortcuts: [
            { name: 'Compare time zones', url: './?view=compare', description: '24-hour overlap grid' },
            { name: 'All time zones', url: './?view=zones', description: 'Every IANA zone, live' },
            { name: 'My cities', url: './?view=pinned', description: 'Your pinned clocks' },
          ],
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/maskable-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
          navigateFallback: offlineShell ? './index.html' : null,
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: offlineShell
            ? [
                {
                  urlPattern: ({ url, request }) =>
                    request.destination === 'image' && url.origin === self.location.origin,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'laveeda-images',
                    expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
                  },
                },
              ]
            : [],
        },
      }),
    ],
    build: {
      target: 'es2022',
      cssCodeSplit: false,
      reportCompressedSize: false,
    },
  }
})
