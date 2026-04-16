import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Config compatible Vite local + deploy Vercel/Render
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
  },
})
