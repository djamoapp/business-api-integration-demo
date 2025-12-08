import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Écoute sur toutes les interfaces pour que ngrok puisse y accéder
    host: true,
    // IMPORTANT : uniquement le nom de domaine, sans http(s) ni slash final
    allowedHosts: ['sillily-tussive-jovani.ngrok-free.dev'],
    port: 5173,
    // Toutes les requêtes vers /api sont proxifiées vers le backend local.
    // Depuis l’extérieur (ngrok), front et back partagent donc la même URL.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});

