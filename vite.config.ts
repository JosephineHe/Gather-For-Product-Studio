import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { rollupOptions: { input: ['index.html', 'Gather_Atomix_Restaurant_Twins.html'] } },
  plugins: [react(), tailwindcss()],
});
