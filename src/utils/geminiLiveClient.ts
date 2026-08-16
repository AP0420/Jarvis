// Gemini 3.1 Flash Live API Real-Time Client (Bidirectional 16kHz/24kHz PCM)

export interface GeminiLiveCallbacks {
  onConnected?: (info: { model: string; voice: string }) => void;
  onDisconnected?: () => void;
  onUserTranscript?: (text: string) => void;
  onAITranscript?: (text: string) => void;
  onSpeakingState?: (isSpeaking: boolean) => void;
  onInterrupted?: () => void;
  onTurnComplete?: () => void;
  onToolCall?: (tool: { callId: string; name: string; args: any }) => void;
  onError?: (error: string) => void;
}

/**
 * Converts Float32Array PCM samples (-1.0 to +1.0) to 16-bit PCM Little Endian base64 string
 */
function float32To16BitPcmBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts base64 16-bit PCM Little Endian string to Float32Array
 */
function base64ToFloat32Array(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;

  private isConnected: boolean = false;
  private isMuted: boolean = false;
  private callbacks: GeminiLiveCallbacks = {};

  // Gapless audio playback scheduling
  private nextStartTime: number = 0;
  private activeSourceNodes: AudioBufferSourceNode[] = [];

  constructor() {}

  public setCallbacks(callbacks: GeminiLiveCallbacks) {
    this.callbacks = callbacks;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public async connect(options: {
    voice?: string;
    assistantName?: string;
    userName?: string;
  } = {}): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    try {
      // 1. Initialize Audio Contexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('Web Audio API not supported on this browser');
      }

      // Input audio context at 16kHz for Gemini Live
      this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      this.inputAnalyser = this.inputAudioCtx.createAnalyser();
      this.inputAnalyser.fftSize = 64;

      // Output audio context at 24kHz for Gemini Live responses
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      this.outputAnalyser = this.outputAudioCtx.createAnalyser();
      this.outputAnalyser.fftSize = 64;
      this.outputAnalyser.connect(this.outputAudioCtx.destination);

      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }
      if (this.outputAudioCtx.state === 'suspended') {
        await this.outputAudioCtx.resume();
      }

      // 2. Request Microphone Stream
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.inputSource = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      // Connect mic to analyser and processor (never directly to speakers)
      this.inputSource.connect(this.inputAnalyser);
      this.inputSource.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);

      // 3. Connect to Backend WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const voice = options.voice || 'Zephyr';
      const assistantName = options.assistantName || 'JARVIS';
      const userName = options.userName || 'Aryan';

      const wsUrl = `${protocol}//${window.location.host}/live?voice=${encodeURIComponent(
        voice
      )}&assistantName=${encodeURIComponent(assistantName)}&userName=${encodeURIComponent(userName)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
      };

      this.ws.onmessage = (event) => {
        this.handleServerMessage(event.data);
      };

      this.ws.onerror = () => {
        this.callbacks.onError?.('Live connection unavailable');
      };

      this.ws.onclose = () => {
        this.disconnect();
      };

      // 4. Stream Mic Audio to WebSocket
      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected || this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
          return;
        }
        const inputData = e.inputBuffer.getChannelData(0);
        // Ensure not complete silence
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / inputData.length;
        if (avg < 0.0005) {
          // Noise gate
          return;
        }

        const base64Audio = float32To16BitPcmBase64(inputData);
        this.ws.send(JSON.stringify({ type: 'audio', audio: base64Audio }));
      };

      return true;
    } catch (err: any) {
      console.error('[Gemini Live Start Error]:', err);
      this.disconnect();
      this.callbacks.onError?.(err?.message || 'Microphone or live connection failed');
      return false;
    }
  }

  private handleServerMessage(rawData: string) {
    try {
      const msg = JSON.parse(rawData);

      switch (msg.type) {
        case 'connected':
          this.callbacks.onConnected?.({ model: msg.model, voice: msg.voice });
          break;

        case 'audio':
          if (msg.audio) {
            this.playAudioChunk(msg.audio);
          }
          break;

        case 'user_transcript':
          if (msg.text) {
            this.callbacks.onUserTranscript?.(msg.text);
          }
          break;

        case 'ai_transcript':
          if (msg.text) {
            this.callbacks.onAITranscript?.(msg.text);
          }
          break;

        case 'interrupted':
          this.stopPlayback();
          this.callbacks.onInterrupted?.();
          break;

        case 'turn_complete':
          this.callbacks.onTurnComplete?.();
          break;

        case 'tool_call':
          this.callbacks.onToolCall?.({
            callId: msg.callId,
            name: msg.name,
            args: msg.args,
          });
          break;

        case 'error':
          this.callbacks.onError?.(msg.error);
          break;

        case 'status':
          if (msg.status === 'closed') {
            this.disconnect();
          }
          break;
      }
    } catch (err) {
      console.warn('[Gemini Live Message Parse Error]:', err);
    }
  }

  private playAudioChunk(base64Audio: string) {
    if (!this.outputAudioCtx || !this.outputAnalyser) return;

    try {
      const float32Samples = base64ToFloat32Array(base64Audio);
      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Samples.length, 24000);
      audioBuffer.getChannelData(0).set(float32Samples);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAnalyser);

      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02; // 20ms jitter buffer
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSourceNodes.push(source);
      this.callbacks.onSpeakingState?.(true);

      source.onended = () => {
        const idx = this.activeSourceNodes.indexOf(source);
        if (idx > -1) {
          this.activeSourceNodes.splice(idx, 1);
        }
        if (this.activeSourceNodes.length === 0) {
          this.callbacks.onSpeakingState?.(false);
        }
      };
    } catch (err) {
      console.warn('[Gemini Live Playback Error]:', err);
    }
  }

  public stopPlayback() {
    for (const source of this.activeSourceNodes) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeSourceNodes = [];
    this.nextStartTime = 0;
    this.callbacks.onSpeakingState?.(false);
  }

  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', text }));
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
  }

  public disconnect() {
    this.isConnected = false;
    this.stopPlayback();

    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch {}
      this.processor = null;
    }

    if (this.inputSource) {
      try {
        this.inputSource.disconnect();
      } catch {}
      this.inputSource = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.callbacks.onDisconnected?.();
  }

  public getAudioFrequencyData(): Uint8Array {
    if (this.outputAnalyser && this.activeSourceNodes.length > 0) {
      const data = new Uint8Array(this.outputAnalyser.frequencyBinCount);
      this.outputAnalyser.getByteFrequencyData(data);
      return data;
    }
    if (this.inputAnalyser && !this.isMuted) {
      const data = new Uint8Array(this.inputAnalyser.frequencyBinCount);
      this.inputAnalyser.getByteFrequencyData(data);
      return data;
    }
    return new Uint8Array(32);
  }
}

export const geminiLiveClient = new GeminiLiveClient();
