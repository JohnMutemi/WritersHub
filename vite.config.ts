import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import themePlugin from '@replit/vite-plugin-shadcn-theme-json';
import path, { dirname } from 'path';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer()
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'), // Make sure the alias is pointing to the client/src folder
      '@shared': path.resolve(__dirname, 'shared'), // Alias for shared directory
      '@assets': path.resolve(__dirname, 'attached_assets'), // Alias for attached_assets folder
    },
  },
  root: path.resolve(__dirname, 'client'), // Make sure Vite knows where the client directory is
  build: {
    outDir: path.resolve(__dirname, 'dist/public'), // Destination for the build output
    emptyOutDir: true,
  },
});
