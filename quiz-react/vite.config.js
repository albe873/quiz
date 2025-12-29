import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Set the base path to the repo name for GitHub Pages
  base: '/quiz/',
  plugins: [react()],
});
