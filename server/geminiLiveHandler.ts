import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Workspace tool declarations for Gemini Live 3.1
const workspaceTools: FunctionDeclaration[] = [
  {
    name: 'openWebsite',
    description: 'Opens a web application or URL in a workspace tab/window preview.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: 'Full valid https URL (e.g. https://www.youtube.com, https://github.com)' },
        title: { type: Type.STRING, description: 'Descriptive title for the window' },
      },
      required: ['url', 'title'],
    },
  },
  {
    name: 'performResearch',
    description: 'Initiates a deep search-grounded intelligence research dossier in a new window.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Topic or query to perform research on' },
      },
      required: ['query'],
    },
  },
  {
    name: 'compareTopics',
    description: 'Opens a comparative analysis matrix between two topics or screens.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topicA: { type: Type.STRING, description: 'First subject to compare' },
        topicB: { type: Type.STRING, description: 'Second subject to compare' },
      },
      required: ['topicA', 'topicB'],
    },
  },
  {
    name: 'arrangeLayout',
    description: 'Organizes all open floating windows into a specified layout on the desktop.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        layout: {
          type: Type.STRING,
          description: 'Layout mode: "grid", "side_by_side", "three_column", "focus", "stack", or "freeform"',
        },
      },
      required: ['layout'],
    },
  },
  {
    name: 'createReminder',
    description: 'Sets a voice alert and timed reminder.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: 'Reminder description' },
        minutes: { type: Type.NUMBER, description: 'Minutes from now until reminder fires' },
      },
      required: ['text'],
    },
  },
  {
    name: 'saveMemory',
    description: 'Saves a key fact, user preference, or note into persistent supercomputer memory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        fact: { type: Type.STRING, description: 'The fact or instruction to remember' },
      },
      required: ['fact'],
    },
  },
  {
    name: 'closeAllWindows',
    description: 'Closes all open windows on the supercomputer workspace.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

export function setupGeminiLiveWebSocket(wss: WebSocketServer) {
  wss.on('connection', async (clientWs: WebSocket, req) => {
    // Parse query params for customizable voice
    let requestedVoice = 'Zephyr';
    let assistantName = 'JARVIS';
    let userName = 'Aryan';

    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      requestedVoice = url.searchParams.get('voice') || 'Zephyr';
      assistantName = url.searchParams.get('assistantName') || 'JARVIS';
      userName = url.searchParams.get('userName') || 'Aryan';
    } catch {
      // Fall back to defaults
    }

    // Valid Gemini Live voices: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoices.includes(requestedVoice) ? requestedVoice : 'Zephyr';

    let session: any = null;

    try {
      session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
          systemInstruction: `You are ${assistantName}, the ultra-intelligent, voice-first AI supercomputer companion assisting ${userName}.
You are powered by Gemini 3.1 Live API.
Tone: Natural, articulate, witty, warm, concise, and highly responsive. Speak like an intelligent human partner (2-3 sentences per turn).
You have full tool-calling access to open websites, execute research dossiers, compare topics, arrange workspace windows, set reminders, and remember user facts.
When user asks you to do something, execute the appropriate tool call while speaking a brief, delightful acknowledgment.`,
          tools: [{ functionDeclarations: workspaceTools }],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: async (message: LiveServerMessage) => {
            try {
              // 1. Audio stream chunks (24kHz PCM)
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && parts.length > 0) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    if (clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(
                        JSON.stringify({
                          type: 'audio',
                          audio: part.inlineData.data,
                        })
                      );
                    }
                  }
                }
              }

              // 2. Transcriptions
              const inputTranscript = (message.serverContent as any)?.inputAudioTranscription?.text;
              if (inputTranscript && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'user_transcript',
                    text: inputTranscript,
                  })
                );
              }

              const outputTranscript = (message.serverContent as any)?.outputAudioTranscription?.text;
              if (outputTranscript && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'ai_transcript',
                    text: outputTranscript,
                  })
                );
              }

              // 3. User Interruption Handling
              if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'interrupted',
                    interrupted: true,
                  })
                );
              }

              // 4. Tool Calls
              const toolCall = (message as any)?.toolCall;
              if (toolCall && toolCall.functionCalls && toolCall.functionCalls.length > 0) {
                for (const fc of toolCall.functionCalls) {
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        callId: fc.id,
                        name: fc.name,
                        args: fc.args,
                      })
                    );
                  }

                  // Respond to tool call so Gemini Live continues smoothly
                  try {
                    await session.sendToolResponse({
                      functionResponses: [
                        {
                          id: fc.id,
                          name: fc.name,
                          response: { output: { success: true, executed: fc.name } },
                        },
                      ],
                    });
                  } catch (toolErr) {
                    console.warn('[Gemini Live Tool Response Err]:', toolErr instanceof Error ? toolErr.message : toolErr);
                  }
                }
              }

              // 5. Turn Complete
              if (message.serverContent?.turnComplete && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'turn_complete',
                  })
                );
              }
            } catch (msgErr) {
              console.warn('[Gemini Live Message Processing Err]:', msgErr);
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'status', status: 'closed' }));
            }
          },
          onerror: (err) => {
            console.error('[Gemini Live Session Error]:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  error: err?.message || 'Live session encountered an issue',
                })
              );
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'connected',
            model: 'gemini-3.1-flash-live-preview',
            voice: chosenVoice,
          })
        );
      }
    } catch (err: any) {
      console.error('[Gemini Live Connect Error]:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error: err?.message || 'Failed to establish Gemini Live connection',
          })
        );
      }
      return;
    }

    clientWs.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'audio' && data.audio && session) {
          session.sendRealtimeInput({
            audio: { data: data.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (data.type === 'text' && data.text && session) {
          session.sendRealtimeInput({
            text: data.text,
          });
        }
      } catch (err) {
        console.warn('[Gemini Live Client Input Error]:', err);
      }
    });

    clientWs.on('close', () => {
      if (session) {
        try {
          session.close();
        } catch {
          // Ignore close error
        }
      }
    });
  });
}
