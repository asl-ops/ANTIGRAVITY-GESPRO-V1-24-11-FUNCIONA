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
  const apiKey = env.API_KEY || env.VITE_API_KEY || env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
  console.log('-----------------------------------------------------');
  console.log('Gestor Expedientes Pro - Configuración de Entorno');
  console.log(`Modo: ${mode}`);
  console.log(`API Key detectada: ${apiKey ? 'SÍ (Termina en ...' + apiKey.slice(-4) + ')' : 'NO - Revisa tu archivo .env'}`);
  console.log('-----------------------------------------------------');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Configuración del servidor de desarrollo optimizada para entornos cloud (Stitch/IDX)
    server: {
      host: '0.0.0.0',  // Permite acceso desde fuera de localhost
      port: 8080,       // Cambiamos a 8080, más amigable con proxies de Google
      strictPort: true, // Falla si el puerto está en uso
      open: false,      // Desactivado para evitar errores en entornos remotos
    },
    // Expone la API_KEY al código del cliente como process.env.API_KEY
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY)
    },
    // OPTIONAL: Optimize dependencies for better performance
    // optimizeDeps: {
    //   exclude: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
    // },
  }
});