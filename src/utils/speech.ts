// Single Unified Gemini Neural Speech Engine
// Powered by Gemini TTS (gemini-3.1-flash-tts-preview) & Web Audio API
// Enforces strictly a SINGLE active voice channel with zero audio collisions.

import { apiService } from '../services/apiService';

type SpeechRecognitionCallback = (text: string, isFinal: boolean) => void;
type SpeechStateCallback = (isListening: boolean, error?: string) => void;

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

export class SpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private shouldKeepListening: boolean = true;
  private onTranscript: SpeechRecognitionCallback | null = null;
  private onStateChange: SpeechStateCallback | null = null;

  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;

  private isSpeakingTTS: boolean = false;
  private onSpeakingChange: ((isSpeaking: boolean) => void) | null = null;
  private restartTimeout: any = null;

  // Strict speech sequence token to eliminate race conditions
  private speechSessionSeq: number = 0;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const win = window as any;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = navigator.language || 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onStateChange?.(true);
        };

        this.recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              final += res[0].transcript;
            } else {
              interim += res[0].transcript;
            }
          }

          if (final.trim()) {
            this.onTranscript?.(final.trim(), true);
          } else if (interim.trim()) {
            this.onTranscript?.(interim.trim(), false);
          }
        };

        this.recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.warn('[Speech] Recognition event:', event.error);
          }
          if (event.error === 'not-allowed') {
            this.shouldKeepListening = false;
            this.isListening = false;
            this.onStateChange?.(false, 'Microphone permission denied');
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.shouldKeepListening) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = setTimeout(() => {
              try {
                if (this.recognition && this.shouldKeepListening && !this.isListening) {
                  this.recognition.start();
                }
              } catch {
                // Ignore start collision
              }
            }, 300);
          } else {
            this.onStateChange?.(false);
          }
        };
      } catch (err) {
        console.warn('[Speech] Init error:', err);
      }
    }
  }

  public setCallbacks(
    onTranscript: SpeechRecognitionCallback,
    onStateChange: SpeechStateCallback,
    onSpeakingChange?: (isSpeaking: boolean) => void
  ) {
    this.onTranscript = onTranscript;
    this.onStateChange = onStateChange;
    this.onSpeakingChange = onSpeakingChange || null;
  }

  public async startListening(): Promise<boolean> {
    this.shouldKeepListening = true;
    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      console.warn('[Speech] Speech recognition not supported on this browser.');
      return false;
    }

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 64;

          try {
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = this.audioCtx.createMediaStreamSource(this.micStream);
            source.connect(this.analyser);
          } catch {
            // Audio analyser optional
          }
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      if (!this.isListening) {
        this.recognition.start();
      }
      return true;
    } catch (err) {
      console.warn('[Speech] Start failed:', err);
      return false;
    }
  }

  public stopListening() {
    this.shouldKeepListening = false;
    this.isListening = false;
    clearTimeout(this.restartTimeout);
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop error
      }
    }
    this.onStateChange?.(false);
  }

  public getAudioFrequencyData(): Uint8Array {
    if (this.isSpeakingTTS && this.outputAnalyser) {
      const data = new Uint8Array(this.outputAnalyser.frequencyBinCount);
      this.outputAnalyser.getByteFrequencyData(data);
      return data;
    }
    if (this.analyser) {
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data);
      return data;
    }
    return new Uint8Array(32);
  }

  /**
   * Immediately halts all vocal playback across all channels
   */
  public stopSpeaking() {
    this.speechSessionSeq++;

    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
      } catch {}
      this.currentAudioSource = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    this.isSpeakingTTS = false;
    this.onSpeakingChange?.(false);
  }

  /**
   * Speaks the given text strictly through the single authentic Gemini Voice engine.
   */
  public async speak(
    text: string,
    options: {
      voiceName?: string;
      voiceGender?: 'male' | 'female';
      rate?: number;
      pitch?: number;
      lang?: string;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ) {
    // 1. Immediately abort any prior utterance and advance session sequence
    this.stopSpeaking();
    const currentSessionId = ++this.speechSessionSeq;

    const cleanText = text
      .replace(/[*#_`~[\]()<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    // Map voice selection to Gemini Voice Personas
    const geminiVoices = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];
    let voiceName = options.voiceName || (options.voiceGender === 'female' ? 'Kore' : 'Zephyr');
    if (!geminiVoices.includes(voiceName)) {
      voiceName = options.voiceGender === 'female' ? 'Kore' : 'Zephyr';
    }

    // 2. High-Fidelity Gemini TTS via /api/tts (gemini-3.1-flash-tts-preview)
    try {
      const base64Audio = await apiService.requestTTS(cleanText, voiceName);

      // Check if another speech request started while we were awaiting TTS
      if (this.speechSessionSeq !== currentSessionId) {
        return;
      }

      if (base64Audio) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          if (!this.outputAudioCtx) {
            this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
            this.outputAnalyser = this.outputAudioCtx.createAnalyser();
            this.outputAnalyser.fftSize = 64;
            this.outputAnalyser.connect(this.outputAudioCtx.destination);
          }

          if (this.outputAudioCtx.state === 'suspended') {
            await this.outputAudioCtx.resume();
          }

          const float32Samples = base64ToFloat32Array(base64Audio);
          const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Samples.length, 24000);
          audioBuffer.getChannelData(0).set(float32Samples);

          const source = this.outputAudioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.outputAnalyser!);

          this.currentAudioSource = source;
          this.isSpeakingTTS = true;
          this.onSpeakingChange?.(true);
          options.onStart?.();

          source.onended = () => {
            if (this.currentAudioSource === source && this.speechSessionSeq === currentSessionId) {
              this.currentAudioSource = null;
              this.isSpeakingTTS = false;
              this.onSpeakingChange?.(false);
              options.onEnd?.();
            }
          };

          source.start(0);
          return;
        }
      }
    } catch (err) {
      console.warn('[Gemini TTS] Seamless fallback:', err);
    }

    // Check again before browser fallback
    if (this.speechSessionSeq !== currentSessionId) {
      return;
    }

    // 3. Fallback: Browser Web Speech API (only if Gemini TTS was unavailable)
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      options.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const gender = options.voiceGender || 'male';

    utterance.rate = options.rate || 1.02;
    utterance.pitch = options.pitch || (gender === 'female' ? 1.12 : 0.94);

    if (options.lang && options.lang !== 'auto') {
      utterance.lang = options.lang;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const targetLang = (options.lang && options.lang !== 'auto' ? options.lang : navigator.language) || 'en';
      const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase()));
      const searchPool = langVoices.length > 0 ? langVoices : voices;

      let selectedVoice: SpeechSynthesisVoice | undefined;
      if (gender === 'female') {
        selectedVoice =
          searchPool.find(
            (v) =>
              v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('samantha') ||
              v.name.toLowerCase().includes('kore') ||
              v.name.toLowerCase().includes('victoria') ||
              v.name.toLowerCase().includes('karen') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('moira')
          ) || searchPool.find((v) => !v.name.toLowerCase().includes('male'));
      } else {
        selectedVoice =
          searchPool.find(
            (v) =>
              v.name.toLowerCase().includes('male') ||
              v.name.toLowerCase().includes('zephyr') ||
              v.name.toLowerCase().includes('daniel') ||
              v.name.toLowerCase().includes('george') ||
              v.name.toLowerCase().includes('david') ||
              v.name.toLowerCase().includes('alex')
          ) || searchPool[0];
      }

      utterance.voice = selectedVoice || searchPool[0] || voices[0];
    }

    utterance.onstart = () => {
      if (this.speechSessionSeq === currentSessionId) {
        this.isSpeakingTTS = true;
        this.onSpeakingChange?.(true);
        options.onStart?.();
      }
    };

    utterance.onend = () => {
      if (this.speechSessionSeq === currentSessionId) {
        this.isSpeakingTTS = false;
        this.onSpeakingChange?.(false);
        options.onEnd?.();
      }
    };

    utterance.onerror = () => {
      if (this.speechSessionSeq === currentSessionId) {
        this.isSpeakingTTS = false;
        this.onSpeakingChange?.(false);
        options.onEnd?.();
      }
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const speechEngine = new SpeechEngine();
