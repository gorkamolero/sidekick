import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src/renderer'
    }
  },
  define: {
    'process.env.OPENROUTER_API_KEY': JSON.stringify(process.env.OPENROUTER_API_KEY || '')
  }
});
