import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({ plugins: [react(), VitePWA({ registerType: 'autoUpdate', includeAssets: ['favicon.svg'], manifest: { name: 'Fieldnote Attendance', short_name: 'Fieldnote', theme_color: '#142d27', background_color: '#f5f5f0', display: 'standalone', start_url: '/', icons: [] } })] })
