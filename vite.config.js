import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 8080,
    host: true,
    allowedHosts: true,
    strictPort: true,
    cors: true
  },
  plugins: [react()],
})
