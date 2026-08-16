import express, { Request, Response } from 'express';
import {
  processUserIntent,
  performDeepSearchResearch,
  compareTwoTopics,
  generateGeminiSpeechAudio,
  chatFollowUp,
} from './geminiService';

export const apiApp = express();

// Body parser
apiApp.use(express.json({ limit: '10mb' }));
apiApp.use(express.urlencoded({ extended: true }));

// Helper to parse JSON body if not already parsed by Vite connect
async function getBody(req: Request): Promise<any> {
  if (req.body && Object.keys(req.body).length > 0) {
    return req.body;
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

// Router handler that works whether mounted at root or at /api
const handleRequest = async (req: Request, res: Response) => {
  const urlPath = req.url.split('?')[0].replace(/^\/api/, '') || '/';

  res.setHeader('Content-Type', 'application/json');

  if (urlPath === '/status' && req.method === 'GET') {
    return res.end(
      JSON.stringify({
        status: 'ONLINE',
        system: 'JARVIS Supercomputer Core v4.2',
        gemini: 'CONNECTED',
        searchGrounding: 'ENABLED',
        multilingual: 'ENABLED',
        timestamp: Date.now(),
      })
    );
  }

  if (urlPath === '/intent' && req.method === 'POST') {
    try {
      const body = await getBody(req);
      const { input, context } = body;
      if (!input) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Input query is required' }));
      }
      const result = await processUserIntent(input, context || {});
      return res.end(JSON.stringify(result));
    } catch (err: any) {
      console.error('Intent API error:', err);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err.message || 'Intent processing error' }));
    }
  }

  if (urlPath === '/research' && req.method === 'POST') {
    try {
      const body = await getBody(req);
      const { query, assistantPersona, language } = body;
      if (!query) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Query is required' }));
      }
      const result = await performDeepSearchResearch(query, assistantPersona, language);
      return res.end(JSON.stringify(result));
    } catch (err: any) {
      console.error('Research API error:', err);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err.message || 'Research synthesis error' }));
    }
  }

  if (urlPath === '/compare' && req.method === 'POST') {
    try {
      const body = await getBody(req);
      const { topicA, topicB, dataA, dataB, language } = body;
      if (!topicA || !topicB) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Both topicA and topicB are required' }));
      }
      const result = await compareTwoTopics(topicA, topicB, dataA, dataB, language);
      return res.end(JSON.stringify(result));
    } catch (err: any) {
      console.error('Compare API error:', err);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err.message || 'Comparison synthesis error' }));
    }
  }

  if (urlPath === '/tts' && req.method === 'POST') {
    try {
      const body = await getBody(req);
      const { text, voiceName } = body;
      if (!text) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Text is required' }));
      }
      const base64Audio = await generateGeminiSpeechAudio(text, voiceName || 'Zephyr');
      return res.end(JSON.stringify({ audio: base64Audio }));
    } catch (err: any) {
      console.error('TTS API error:', err);
      return res.end(JSON.stringify({ audio: null }));
    }
  }

  if (urlPath === '/chat' && req.method === 'POST') {
    try {
      const body = await getBody(req);
      const { message, history, windowContext, language } = body;
      if (!message) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Message is required' }));
      }
      const reply = await chatFollowUp(message, history || [], windowContext, language);
      return res.end(JSON.stringify({ reply }));
    } catch (err: any) {
      console.error('Chat API error:', err);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err.message || 'Chat synthesis error' }));
    }
  }

  res.statusCode = 404;
  return res.end(JSON.stringify({ error: `Not found: ${urlPath}` }));
};

export { handleRequest };

apiApp.use((req, res) => handleRequest(req, res));
