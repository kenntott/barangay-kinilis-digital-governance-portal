import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listens on all local network interfaces (0.0.0.0) for mobile Wi-Fi testing
    port: 3000,
    open: true
  }
})
