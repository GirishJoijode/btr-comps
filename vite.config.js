import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from the GitHub Pages sub-path:
//   https://girishjoijode.github.io/test_rental_comps/
// so the base must match the repo name for assets to resolve.
export default defineConfig({
  plugins: [react()],
  base: '/test_rental_comps/',
})
