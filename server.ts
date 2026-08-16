import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { handleRequest } from './server/apiApp';
import { setupGeminiLiveWebSocket } from './server/geminiLiveHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// API route middleware
app.use('/api', (req, res) => {
  handleRequest(req as any, res as any);
});

// Serve frontend in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) return;
  res.sendFile(path.join(distPath, 'index.html'));
});

// Setup WebSocket server for Gemini Live API (gemini-3.1-flash-live-preview)
const wss = new WebSocketServer({ noServer: true });
setupGeminiLiveWebSocket(wss);

server.on('upgrade', (req, socket, head) => {
  const pathname = req.url ? new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname : '';
  if (pathname === '/live' || pathname === '/ws/live') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`JARVIS Supercomputer server running on port ${PORT}`);
  console.log(`- Gemini Live WebSocket ready at ws://localhost:${PORT}/live`);
  console.log(`- Gemini API ready at http://localhost:${PORT}/api`);
});
