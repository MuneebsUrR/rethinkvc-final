import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows external access
    allowedHosts: [
      'localhost',
      '.ngrok-free.app' // Allows all ngrok-free.app subdomains
    ]
  }
})
