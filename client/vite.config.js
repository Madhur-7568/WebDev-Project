import { defineConfig } from 'vite';

// Pure Vanilla JS / HTML5 / CSS3 Configuration
export default defineConfig({
  plugins: [],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
