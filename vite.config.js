import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  publicDir: path.resolve(__dirname, '../00 - data'), // Mantenha esta linha
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm'], // ADICIONE ESTA LINHA
  },
});