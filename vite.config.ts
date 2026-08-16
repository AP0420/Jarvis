import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { WebSocketServer } from 'ws';
import { handleRequest } from './server/apiApp';
import { setupGeminiLiveWebSocket } from './server/geminiLiveHandler';

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          handleRequest(req as any, res as any);
        } else {
          next();
        }
      });

      if (server.httpServer) {
        const wss = new WebSocketServer({ noServer: true });
        setupGeminiLiveWebSocket(wss);

        server.httpServer.on('upgrade', (req, socket, head) => {
          const pathname = req.url ? new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname : '';
          if (pathname === '/live' || pathname === '/ws/live') {
            wss.handleUpgrade(req, socket, head, (ws) => {
              wss.emit('connection', ws, req);
            });
          }
        });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
