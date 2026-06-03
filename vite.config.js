import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The production build is served from a GitHub Pages sub-path:
//   https://girishjoijode.github.io/test_rental_comps/
// so assets must be requested from "/test_rental_comps/".
// Local `npm run dev` keeps the root base ("/") so the dev server
// works at http://localhost:5173/ without any sub-path.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/test_rental_comps/' : '/',
}))
