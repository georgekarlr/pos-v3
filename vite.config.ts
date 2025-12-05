import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            devOptions: {
                enabled: true,
            },
            manifest: {
                name: 'POS Pro v2',
                short_name: 'PosPro',
                description: 'Online Point of Sale Application',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                theme_color: '#0ea5e9',
                background_color: '#ffffff',
                icons: [
                    {
                        src: '/icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any'
                    },
                    {
                        src: '/icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            }
        })
    ],
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
});
