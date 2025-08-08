import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  server: {
    port: 3000,
    // Removido proxy para Railway - usando apenas Supabase
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Desabilitar sourcemap para produção
    minify: 'terser', // Usar terser para melhor minificação
    rollupOptions: {
      external: ['@rollup/rollup-linux-x64-gnu'],
      output: {
        manualChunks: undefined,
        // Otimizar chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      onwarn(warning, warn) {
        // Ignorar warnings de TypeScript durante o build
        if (warning.code === 'TS2307' || warning.code === 'TS2339' || warning.code === 'TS2345') {
          return;
        }
        warn(warning);
      }
    },
    // Otimizações para produção
    target: 'es2015',
    cssCodeSplit: true,
    reportCompressedSize: false
  },
  optimizeDeps: {
    exclude: ['@rollup/rollup-linux-x64-gnu'],
    include: ['react', 'react-dom']
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    // Definir variáveis para dados reais
    '__VUE_PROD_DEVTOOLS__': false,
    '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': false
  }
}) 