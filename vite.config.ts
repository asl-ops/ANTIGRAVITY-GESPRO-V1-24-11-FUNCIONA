// FIX: Replaced the triple-slash directive with a direct import to provide proper Node.js types for the `process` global.
import process from 'node:process';
import path from 'path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga el archivo .env según el 'mode' en el directorio de trabajo actual.
  // El tercer parámetro '' carga todas las variables sin necesidad del prefijo VITE_.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Configuración del servidor de desarrollo
    server: {
      port: 5173,       // Fija el puerto a 5173
      strictPort: true, // Falla si el puerto está en uso, en lugar de probar otro
      open: true,       // Abre automáticamente el navegador
    },
    // Expone la API_KEY al código del cliente como process.env.API_KEY
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY)
    },
    optimizeDeps: {
      exclude: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
    },
  }
});