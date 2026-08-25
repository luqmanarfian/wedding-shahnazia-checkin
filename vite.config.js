import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'https://localhost:3000';

  return {
    plugins: [react(), tailwindcss(), basicSsl()],
    server: {
      host: true, // Allow LAN IP access
      port: 5173,
      https: true, // let plugin-basic-ssl generate a cert for dev
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
