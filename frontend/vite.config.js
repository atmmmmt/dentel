import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // PWA: يخزّن واجهة التطبيق كاملة على الجهاز — تفتح بدون إنترنت
    // حتى بعد إعادة تشغيل الجهاز. بيانات الـ API تُدار عبر IndexedDB
    // في src/services/offlineStore.js
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'dentovi-icon.svg', 'dentovi-mark.svg'],
      manifest: {
        name: 'Dentovi — منصة إدارة عيادات الأسنان',
        short_name: 'Dentovi',
        description: 'نظام إدارة عيادات الأسنان — يعمل أونلاين وأوفلاين',
        theme_color: '#0B2D4A',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'any',
        dir: 'rtl',
        lang: 'ar',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/dentovi-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/dentovi-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/dentovi-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,glb}'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        // لا تعترض طلبات الـ API — طبقة IndexedDB تتكفل بها
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5180,
    proxy: {
      '/api': {
        target: 'http://localhost:5100',
        changeOrigin: true,
      },
    },
  },
});
