import express, { Request, Response, Router } from 'express';
import {
  processUserIntent,
  performDeepSearchResearch,
  compareTwoTopics,
  generateGeminiSpeechAudio,
  chatFollowUp,
} from './geminiService';

export const apiRouter = Router();

apiRouter.use(express.json());

apiRouter.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'JARVIS Supercomputer Core v4.2',
    gemini: 'CONNECTED',
    searchGrounding: 'ENABLED',
    timestamp: Date.now(),
  });
});

apiRouter.post('/intent', async (req: Request, res: Response) => {
  try {
    const { input, context } = req.body;
    if (!input) {
      return res.status(400).json({ error: 'Input query is required' });
    }
    const result = await processUserIntent(input, context || {});
    res.json(result);
  } catch (err: any) {
    console.error('Intent API error:', err);
    res.status(500).json({ error: err.message || 'Intent processing error' });
  }
});

apiRouter.post('/research', async (req: Request, res: Response) => {
  try {
    const { query, assistantPersona } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    const result = await performDeepSearchResearch(query, assistantPersona);
    res.json(result);
  } catch (err: any) {
    console.error('Research API error:', err);
    res.status(500).json({ error: err.message || 'Research synthesis error' });
  }
});

apiRouter.post('/compare', async (req: Request, res: Response) => {
  try {
    const { topicA, topicB, dataA, dataB } = req.body;
    if (!topicA || !topicB) {
      return res.status(400).json({ error: 'Both topicA and topicB are required' });
    }
    const result = await compareTwoTopics(topicA, topicB, dataA, dataB);
    res.json(result);
  } catch (err: any) {
    console.error('Compare API error:', err);
    res.status(500).json({ error: err.message || 'Comparison synthesis error' });
  }
});

apiRouter.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    const base64Audio = await generateGeminiSpeechAudio(text, voiceName || 'Zephyr');
    res.json({ audio: base64Audio });
  } catch (err: any) {
    console.error('TTS API error:', err);
    res.status(500).json({ error: err.message || 'TTS generation error' });
  }
});

apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, windowContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const reply = await chatFollowUp(message, history || [], windowContext);
    res.json({ reply });
  } catch (err: any) {
    console.error('Chat API error:', err);
    res.status(500).json({ error: err.message || 'Chat synthesis error' });
  }
});
