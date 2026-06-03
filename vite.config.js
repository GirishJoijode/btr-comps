import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Using a relative base ("./") keeps asset paths working on GitHub Pages
// regardless of the repository name / sub-path it is served from.
export default defineConfig({
  plugins: [react()],
  base: './',
})
