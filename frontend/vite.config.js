// Configuration Vite : bundler et serveur de développement du frontend.
// Le serveur de dev écoute sur le port 5173 (http://localhost:5173).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});