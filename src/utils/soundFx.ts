// Web Audio API procedural sound synthesizer for futuristic OS acoustic feedback
// Features anti-artifacting dynamics compressor, micro-fade envelopes, and zero-click oscillator routing.

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.85;

  // Debounce & throttling timestamps
  private lastLockOnTime: number = 0;
  private lastLostTime: number = 0;
  private lastActionSoundTime: number = 0;

  // Initialize Web Audio graph with DynamicsCompressor to completely eliminate audio clipping & popping
  private initContext() {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Dynamics Compressor to prevent clipping, digital distortion, and harsh peaks
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        // Route: Compressor -> Master Gain -> Destination
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Helper: Connect an audio sub-node through the anti-artifact master chain.
   */
  private connectToChain(node: AudioNode) {
    if (this.compressor) {
      node.connect(this.compressor);
    } else if (this.masterGain) {
      node.connect(this.masterGain);
    } else if (this.ctx) {
      node.connect(this.ctx.destination);
    }
  }

  // Sci-Fi Hand Detected / Target Acquired Lock-on Acoustic Signature
  public playHandLockOn() {
    if (!this.isEnabled) return;
    const realNow = Date.now();
    // Throttle lock-on to avoid spam artifacts
    if (realNow - this.lastLockOnTime < 800) return;
    this.lastLockOnTime = realNow;

    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Primary tone: FM sweep
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const filter1 = this.ctx.createBiquadFilter();

      filter1.type = 'bandpass';
      filter1.frequency.setValueAtTime(1200, now);
      filter1.Q.setValueAtTime(3.5, now);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.08); // G6

      // Micro-fade anti-click envelope
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc1.connect(filter1);
      filter1.connect(gain1);
      this.connectToChain(gain1);

      // Harmonic secondary shimmer tone
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1975.53, now + 0.03); // B6
      osc2.frequency.exponentialRampToValueAtTime(2637.02, now + 0.1); // E7

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.0001, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.09, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc2.connect(gain2);
      this.connectToChain(gain2);

      osc1.start(now);
      osc2.start(now + 0.03);
      osc1.stop(now + 0.18);
      osc2.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }

  // Hand Lost / Tracking Standby Sound
  public playHandLost() {
    if (!this.isEnabled) return;
    const realNow = Date.now();
    if (realNow - this.lastLostTime < 1000) return;
    this.lastLostTime = realNow;

    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.12);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      this.connectToChain(gain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  // Sci-Fi Gesture Command Sound Synthesizer (Zero-Click, Resonant & Clean)
  public playGestureAction(gesture: string) {
    if (!this.isEnabled) return;
    const realNow = Date.now();
    if (realNow - this.lastActionSoundTime < 300) return;
    this.lastActionSoundTime = realNow;

    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      if (gesture === 'SWIPE_RIGHT') {
        // High-Tech Cyber Sweep Ascending
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1480, now + 0.14);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.14);
        filter.Q.setValueAtTime(3.0, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

        osc.connect(filter);
        filter.connect(gain);
        this.connectToChain(gain);

        osc.start(now);
        osc.stop(now + 0.17);
      } else if (gesture === 'SWIPE_LEFT') {
        // High-Tech Cyber Sweep Descending
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1350, now);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.14);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(700, now + 0.14);
        filter.Q.setValueAtTime(3.0, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

        osc.connect(filter);
        filter.connect(gain);
        this.connectToChain(gain);

        osc.start(now);
        osc.stop(now + 0.17);
      } else if (gesture === 'FIST') {
        // Hydraulic Clamp & Sub-bass Thud
        const oscSub = this.ctx.createOscillator();
        const gainSub = this.ctx.createGain();

        oscSub.type = 'sine';
        oscSub.frequency.setValueAtTime(260, now);
        oscSub.frequency.exponentialRampToValueAtTime(65, now + 0.12);

        gainSub.gain.setValueAtTime(0.0001, now);
        gainSub.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
        gainSub.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        oscSub.connect(gainSub);
        this.connectToChain(gainSub);

        // Metallic High-pass Click
        const oscClick = this.ctx.createOscillator();
        const gainClick = this.ctx.createGain();
        const hpFilter = this.ctx.createBiquadFilter();

        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(2200, now);

        oscClick.type = 'triangle';
        oscClick.frequency.setValueAtTime(1200, now);
        oscClick.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gainClick.gain.setValueAtTime(0.0001, now);
        gainClick.gain.exponentialRampToValueAtTime(0.08, now + 0.005);
        gainClick.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        oscClick.connect(hpFilter);
        hpFilter.connect(gainClick);
        this.connectToChain(gainClick);

        oscSub.start(now);
        oscClick.start(now);
        oscSub.stop(now + 0.16);
        oscClick.stop(now + 0.06);
      } else if (gesture === 'SPREAD') {
        // Crystalline Holographic Matrix Arpeggio (E Maj9)
        const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
        notes.forEach((freq, idx) => {
          const noteStart = now + idx * 0.028;
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.0001, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.09, noteStart + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.22);

          osc.connect(gain);
          this.connectToChain(gain);

          osc.start(noteStart);
          osc.stop(noteStart + 0.24);
        });
      } else if (gesture === 'PINCH') {
        // Laser Precision Notch Chirp
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.07);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        osc.connect(gain);
        this.connectToChain(gain);

        osc.start(now);
        osc.stop(now + 0.1);
      } else {
        // OPEN_PALM / Spatial Focus Dual-Harmonic Chime
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(783.99, now); // G5
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1174.66, now); // D6

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

        osc1.connect(gain);
        osc2.connect(gain);
        this.connectToChain(gain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.18);
        osc2.stop(now + 0.18);
      }
    } catch {
      // Ignore
    }
  }

  // JARVIS activation chirp
  public playWakeChirp() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.16);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      this.connectToChain(gain);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Ignore
    }
  }

  // Window creation / snap
  public playWindowSnap() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.06);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      this.connectToChain(gain);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Ignore
    }
  }

  // Research complete / Data incoming
  public playDataStream() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.045;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.07, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        osc.connect(gain);
        this.connectToChain(gain);

        osc.start(now);
        osc.stop(now + 0.15);
      });
    } catch {
      // Ignore
    }
  }

  // Button / Command click
  public playBlip() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      this.connectToChain(gain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  // Reminder alert chime
  public playReminderAlert() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const now = this.ctx!.currentTime + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        this.connectToChain(gain);

        osc.start(now);
        osc.stop(now + 0.46);
      });
    } catch {
      // Ignore
    }
  }

  // Camera shutter / snapshot acoustic feedback
  public playCameraSnap() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
      osc.frequency.setValueAtTime(1800, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.09);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      this.connectToChain(gain);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }

  // Error / Attention required
  public playErrorAlert() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      this.connectToChain(gain);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore
    }
  }
}

export const soundFx = new SoundEffectsEngine();
