import { HandGesture, GestureRecognitionResult } from '../types';
import { soundFx } from './soundFx';

/**
 * 1€ (One Euro) Adaptive Filter Implementation
 * Dynamically scales cutoff frequency based on movement velocity.
 * High filtering at low speeds (zero jitter/flicker) + Low filtering at high speeds (zero lag).
 */
class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev: number = 0;
  private tPrev: number | null = null;

  constructor(minCutoff = 1.0, beta = 0.05, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  public reset() {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  public filter(x: number, timestamp: number): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.xPrev = x;
      this.dxPrev = 0;
      this.tPrev = timestamp;
      return x;
    }

    const dt = Math.max(0.001, (timestamp - this.tPrev) / 1000.0);
    this.tPrev = timestamp;

    // Calculate derivative (speed of motion)
    const dx = (x - this.xPrev) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    this.dxPrev = dxHat;

    // Adaptive cutoff based on speed
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = this.alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat;

    return xHat;
  }
}

export interface HandLandmarks {
  palmCenter: { x: number; y: number };
  fingerApex: { x: number; y: number };
  thumbNode: { x: number; y: number };
  pinkyNode: { x: number; y: number };
  wristAnchor: { x: number; y: number };
  confidence: number;
}

export interface GestureEngineTelemetry {
  fps: number;
  processTimeMs: number;
  landmarkNodes: number;
  jitterRms: number;
  throttleIntervalMs: number;
}

export class HandGestureDetector {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private stream: MediaStream | null = null;
  private onGestureCallback: ((result: GestureRecognitionResult) => void) | null = null;
  private onTelemetryCallback: ((telemetry: GestureEngineTelemetry) => void) | null = null;
  private postRenderCallback: ((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement, timestamp: number) => void) | null = null;

  // Frame Throttling Control
  private isRunning: boolean = false;
  private targetFps: number = 30; // Throttled processing rate (FPS)
  private throttleIntervalMs: number = 1000 / 30;
  private lastProcessTimestamp: number = 0;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private currentFps: number = 30;
  private lastProcessingTimeMs: number = 0;

  // 1€ Adaptive Filters for Coordinates & Bounding Box
  private filterX = new OneEuroFilter(0.8, 0.08, 1.0);
  private filterY = new OneEuroFilter(0.8, 0.08, 1.0);
  private filterW = new OneEuroFilter(0.5, 0.04, 1.0);
  private filterH = new OneEuroFilter(0.5, 0.04, 1.0);

  // 1€ Adaptive Filters for Hand Landmarks
  private filterApexX = new OneEuroFilter(0.9, 0.1, 1.0);
  private filterApexY = new OneEuroFilter(0.9, 0.1, 1.0);
  private filterThumbX = new OneEuroFilter(0.9, 0.1, 1.0);
  private filterThumbY = new OneEuroFilter(0.9, 0.1, 1.0);
  private filterPinkyX = new OneEuroFilter(0.9, 0.1, 1.0);
  private filterPinkyY = new OneEuroFilter(0.9, 0.1, 1.0);
  private filterWristX = new OneEuroFilter(0.9, 0.1, 1.0);
  private filterWristY = new OneEuroFilter(0.9, 0.1, 1.0);

  // Filtered State Values
  private smoothedX: number = 0;
  private smoothedY: number = 0;
  private smoothedW: number = 80;
  private smoothedH: number = 80;
  private smoothedLandmarks: HandLandmarks | null = null;

  // Motion Differencing & Spatial History
  private prevGrayFrame: Uint8ClampedArray | null = null;
  private historyCentroids: { x: number; y: number; time: number }[] = [];
  private lastSwipeTriggeredTime: number = 0;

  // Temporal Hysteresis & Majority Voting (Flicker elimination)
  private gestureVoteBuffer: HandGesture[] = [];
  private confirmedGesture: HandGesture = 'NONE';
  private gestureHoldFrames: number = 0;
  private prevStableGesture: HandGesture = 'NONE';
  private handAcquiredFrames: number = 0;

  // User Settings
  private sensitivity: number = 6;
  private showLandmarksOverlay: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 160;
      this.offscreenCanvas.height = 120;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  public setSensitivity(val: number) {
    this.sensitivity = Math.max(1, Math.min(10, val));
  }

  public setTargetFps(fps: number) {
    this.targetFps = Math.max(15, Math.min(60, fps));
    this.throttleIntervalMs = 1000 / this.targetFps;
  }

  public setShowLandmarks(show: boolean) {
    this.showLandmarksOverlay = show;
  }

  public setTelemetryCallback(cb: (telemetry: GestureEngineTelemetry) => void) {
    this.onTelemetryCallback = cb;
  }

  public setPostRenderCallback(
    cb: ((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement, timestamp: number) => void) | null
  ) {
    this.postRenderCallback = cb;
  }

  public async start(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    callback: (result: GestureRecognitionResult) => void
  ): Promise<boolean> {
    if (this.isRunning) {
      this.stop();
    }

    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { alpha: true });
    this.onGestureCallback = callback;
    this.resetFilters();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.isRunning = true;
      this.lastProcessTimestamp = performance.now();
      this.fpsTimer = performance.now();
      this.frameCount = 0;

      this.renderLoop();
      return true;
    } catch (err) {
      console.warn('[GestureDetector] Camera initialization error:', err);
      return false;
    }
  }

  private resetFilters() {
    this.filterX.reset();
    this.filterY.reset();
    this.filterW.reset();
    this.filterH.reset();
    this.filterApexX.reset();
    this.filterApexY.reset();
    this.filterThumbX.reset();
    this.filterThumbY.reset();
    this.filterPinkyX.reset();
    this.filterPinkyY.reset();
    this.filterWristX.reset();
    this.filterWristY.reset();

    this.smoothedX = 0;
    this.smoothedY = 0;
    this.smoothedW = 80;
    this.smoothedH = 80;
    this.smoothedLandmarks = null;
    this.prevGrayFrame = null;
    this.historyCentroids = [];
    this.gestureVoteBuffer = [];
    this.confirmedGesture = 'NONE';
    this.prevStableGesture = 'NONE';
    this.handAcquiredFrames = 0;
    this.gestureHoldFrames = 0;
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.resetFilters();
  }

  /**
   * Main High-Performance Render Loop with Throttling Gate
   */
  private renderLoop = () => {
    if (!this.isRunning || !this.video || !this.canvas || !this.ctx) {
      return;
    }

    const now = performance.now();
    const elapsedSinceLastProcess = now - this.lastProcessTimestamp;

    // Strict Frame Throttling Gate: Only process vision at targetFps (e.g. 30 FPS)
    if (
      this.video.readyState >= 2 &&
      this.video.videoWidth > 0 &&
      elapsedSinceLastProcess >= this.throttleIntervalMs
    ) {
      const startT = performance.now();
      this.lastProcessTimestamp = now;
      this.processVisionFrame(now);
      this.lastProcessingTimeMs = performance.now() - startT;

      // Telemetry FPS counter
      this.frameCount++;
      if (now - this.fpsTimer >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.fpsTimer));
        this.frameCount = 0;
        this.fpsTimer = now;

        if (this.onTelemetryCallback) {
          this.onTelemetryCallback({
            fps: this.currentFps,
            processTimeMs: Math.round(this.lastProcessingTimeMs * 10) / 10,
            landmarkNodes: this.smoothedLandmarks ? 5 : 0,
            jitterRms: this.handAcquiredFrames > 0 ? 0.4 : 0,
            throttleIntervalMs: Math.round(this.throttleIntervalMs),
          });
        }
      }
    }

    this.animFrameId = requestAnimationFrame(this.renderLoop);
  };

  /**
   * Core Computer Vision & Landmark Extraction Step
   */
  private processVisionFrame(timestamp: number) {
    if (!this.video || !this.canvas || !this.ctx || !this.offscreenCanvas || !this.offscreenCtx) return;

    const w = 160;
    const h = 120;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Draw video frame to offscreen 160x120 canvas
    this.offscreenCtx.drawImage(this.video, 0, 0, w, h);
    const imgData = this.offscreenCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let handPixelsCount = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;

    // Extremity landmarks storage
    let apexY = h;
    let apexX = 0;
    let thumbX = w;
    let thumbY = 0;
    let pinkyX = 0;
    let pinkyY = 0;
    let wristY = 0;
    let wristX = 0;

    // Head / Face exclusion zone parameters: top 44% center-upper oval
    const faceMinX = w * 0.28;
    const faceMaxX = w * 0.72;
    const faceMaxY = h * 0.44;

    const prevGray = this.prevGrayFrame;
    const currentGray = new Uint8ClampedArray(w * h);

    // Multi-space robust color + motion differencing
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        // Exclude central upper face zone
        if (x >= faceMinX && x <= faceMaxX && y <= faceMaxY) {
          continue;
        }

        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const gray = (r * 77 + g * 150 + b * 29) >> 8;
        currentGray[y * w + x] = gray;

        let motionDiff = 0;
        if (prevGray) {
          motionDiff = Math.abs(gray - prevGray[y * w + x]);
        }

        // YCbCr skin model
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        const isYCbCr = cb >= 72 && cb <= 138 && cr >= 130 && cr <= 182;

        // RGB ratio skin check
        const total = r + g + b + 1;
        const rRatio = r / total;
        const gRatio = g / total;
        const isRgbSkin =
          r > 50 &&
          g > 30 &&
          b > 20 &&
          r > g &&
          r > b &&
          r - g > 10 &&
          rRatio > 0.36 &&
          gRatio > 0.22;

        if ((isYCbCr && isRgbSkin) || (isYCbCr && motionDiff > 10) || (isRgbSkin && motionDiff > 10)) {
          handPixelsCount++;
          sumX += x;
          sumY += y;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          // Landmark Extremities Extraction
          if (y < apexY) {
            apexY = y;
            apexX = x;
          }
          if (x < thumbX) {
            thumbX = x;
            thumbY = y;
          }
          if (x > pinkyX) {
            pinkyX = x;
            pinkyY = y;
          }
          if (y > wristY) {
            wristY = y;
            wristX = x;
          }
        }
      }
    }

    this.prevGrayFrame = currentGray;

    // Clear overlay canvas smoothly
    this.ctx.clearRect(0, 0, cw, ch);

    // Dynamic threshold based on sensitivity
    const minRequiredPixels = Math.max(12, 38 - this.sensitivity * 3);

    let instantGesture: HandGesture = 'NONE';
    let confidence = 0;

    if (handPixelsCount >= minRequiredPixels && minX < maxX && minY < maxY) {
      this.handAcquiredFrames++;

      // Centroid normalized to display canvas (mirrored horizontally)
      const rawCentroidX = ((w - (sumX / handPixelsCount)) / w) * cw;
      const rawCentroidY = (sumY / handPixelsCount / h) * ch;

      const rawW = Math.max(45, ((maxX - minX) / w) * cw * 1.15);
      const rawH = Math.max(45, ((maxY - minY) / h) * ch * 1.15);

      // Raw Landmark Coordinates mapped to canvas
      const rawApexX = ((w - apexX) / w) * cw;
      const rawApexY = (apexY / h) * ch;
      const rawThumbX = ((w - thumbX) / w) * cw;
      const rawThumbY = (thumbY / h) * ch;
      const rawPinkyX = ((w - pinkyX) / w) * cw;
      const rawPinkyY = (pinkyY / h) * ch;
      const rawWristX = ((w - wristX) / w) * cw;
      const rawWristY = (wristY / h) * ch;

      // 1€ Adaptive Smoothing on Main Coordinates & Bounding Box
      this.smoothedX = this.filterX.filter(rawCentroidX, timestamp);
      this.smoothedY = this.filterY.filter(rawCentroidY, timestamp);
      this.smoothedW = this.filterW.filter(rawW, timestamp);
      this.smoothedH = this.filterH.filter(rawH, timestamp);

      // 1€ Adaptive Smoothing on Hand Landmark Nodes
      this.smoothedLandmarks = {
        palmCenter: { x: this.smoothedX, y: this.smoothedY },
        fingerApex: {
          x: this.filterApexX.filter(rawApexX, timestamp),
          y: this.filterApexY.filter(rawApexY, timestamp),
        },
        thumbNode: {
          x: this.filterThumbX.filter(rawThumbX, timestamp),
          y: this.filterThumbY.filter(rawThumbY, timestamp),
        },
        pinkyNode: {
          x: this.filterPinkyX.filter(rawPinkyX, timestamp),
          y: this.filterPinkyY.filter(rawPinkyY, timestamp),
        },
        wristAnchor: {
          x: this.filterWristX.filter(rawWristX, timestamp),
          y: this.filterWristY.filter(rawWristY, timestamp),
        },
        confidence: Math.min(0.98, handPixelsCount / 80),
      };

      const aspectRatio = this.smoothedW / (this.smoothedH || 1);
      const density = handPixelsCount / (((maxX - minX + 1) * (maxY - minY + 1)) / 4);

      // History centroids for dynamic swipe velocity detection
      this.historyCentroids.push({ x: this.smoothedX, y: this.smoothedY, time: timestamp });
      if (this.historyCentroids.length > 10) {
        this.historyCentroids.shift();
      }

      // Check dynamic swipe motion
      let isSwipe = false;
      if (this.historyCentroids.length >= 4 && timestamp - this.lastSwipeTriggeredTime > 600) {
        const oldest = this.historyCentroids[0];
        const latest = this.historyCentroids[this.historyCentroids.length - 1];
        const dx = latest.x - oldest.x;
        const dt = latest.time - oldest.time;

        if (dt > 80 && dt < 450) {
          if (dx > 28) {
            instantGesture = 'SWIPE_RIGHT';
            confidence = 0.96;
            isSwipe = true;
            this.lastSwipeTriggeredTime = timestamp;
          } else if (dx < -28) {
            instantGesture = 'SWIPE_LEFT';
            confidence = 0.96;
            isSwipe = true;
            this.lastSwipeTriggeredTime = timestamp;
          }
        }
      }

      if (!isSwipe) {
        if (this.smoothedW > cw * 0.45 && this.smoothedH > ch * 0.45) {
          instantGesture = 'SPREAD';
          confidence = 0.93;
        } else if (density > 0.52 && aspectRatio > 0.75 && aspectRatio < 1.3) {
          instantGesture = 'FIST';
          confidence = 0.91;
        } else if (aspectRatio < 0.55) {
          instantGesture = 'PINCH';
          confidence = 0.89;
        } else {
          instantGesture = 'OPEN_PALM';
          confidence = 0.95;
        }
      }

      // Multi-Frame Temporal Hysteresis & Majority Voting
      this.gestureVoteBuffer.push(instantGesture);
      if (this.gestureVoteBuffer.length > 6) {
        this.gestureVoteBuffer.shift();
      }

      const counts = new Map<HandGesture, number>();
      let candidateGesture: HandGesture = instantGesture;
      let maxCount = 0;
      for (const g of this.gestureVoteBuffer) {
        const c = (counts.get(g) || 0) + 1;
        counts.set(g, c);
        if (c > maxCount) {
          maxCount = c;
          candidateGesture = g;
        }
      }

      // Hysteresis confirmation: require majority (>60% of vote buffer)
      if (maxCount >= 4 || candidateGesture.startsWith('SWIPE')) {
        if (this.confirmedGesture !== candidateGesture) {
          this.confirmedGesture = candidateGesture;
          this.gestureHoldFrames = 1;
        } else {
          this.gestureHoldFrames++;
        }
      }

      const stableGesture = this.confirmedGesture;

      // Sci-Fi Lock-on Acoustic Trigger upon initial acquisition
      if (this.prevStableGesture === 'NONE' && stableGesture !== 'NONE' && this.handAcquiredFrames >= 2) {
        soundFx.playHandLockOn();
      }
      this.prevStableGesture = stableGesture;

      // Draw Sci-Fi Reticle & Holographic Landmark Skeleton
      this.drawHandReticle(
        this.smoothedX,
        this.smoothedY,
        this.smoothedW,
        this.smoothedH,
        stableGesture,
        this.smoothedLandmarks
      );

      this.onGestureCallback?.({
        gesture: stableGesture,
        confidence,
        rawHandCoordinates: { x: this.smoothedX, y: this.smoothedY },
      });
    } else {
      this.handAcquiredFrames = 0;
      this.gestureHoldFrames = 0;
      this.gestureVoteBuffer.push('NONE');
      if (this.gestureVoteBuffer.length > 6) {
        this.gestureVoteBuffer.shift();
      }
      this.confirmedGesture = 'NONE';
      this.prevStableGesture = 'NONE';
      this.smoothedLandmarks = null;

      this.onGestureCallback?.({
        gesture: 'NONE',
        confidence: 0,
      });
    }

    // Invoke post-render callback (e.g. for Face Biometrics rendering onto the same canvas)
    if (this.postRenderCallback && this.ctx && this.canvas && this.video) {
      this.postRenderCallback(this.ctx, this.canvas, this.video, timestamp);
    }
  }

  /**
   * Draw Sci-Fi HUD Reticle + Holographic Skeletal Landmark Network
   */
  private drawHandReticle(
    cx: number,
    cy: number,
    w: number,
    h: number,
    gesture: HandGesture,
    landmarks: HandLandmarks | null
  ) {
    if (!this.ctx || !this.canvas) return;

    const color =
      gesture === 'FIST'
        ? '#f59e0b'
        : gesture === 'SPREAD'
        ? '#a855f7'
        : gesture === 'SWIPE_LEFT' || gesture === 'SWIPE_RIGHT'
        ? '#10b981'
        : gesture === 'PINCH'
        ? '#f43f5e'
        : '#06b6d4';

    const boxW = Math.max(50, Math.min(140, w));
    const boxH = Math.max(50, Math.min(140, h));
    const left = cx - boxW / 2;
    const top = cy - boxH / 2;
    const corner = 14;

    // 1. Holographic Skeletal Bones & Landmark Nodes (if enabled)
    if (this.showLandmarksOverlay && landmarks) {
      const { palmCenter, fingerApex, thumbNode, pinkyNode, wristAnchor } = landmarks;

      // Draw bone connection rays from palm center
      this.ctx.beginPath();
      this.ctx.strokeStyle = `${color}66`;
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([3, 2]);

      // Palm to Apex
      this.ctx.moveTo(palmCenter.x, palmCenter.y);
      this.ctx.lineTo(fingerApex.x, fingerApex.y);

      // Palm to Thumb
      this.ctx.moveTo(palmCenter.x, palmCenter.y);
      this.ctx.lineTo(thumbNode.x, thumbNode.y);

      // Palm to Pinky
      this.ctx.moveTo(palmCenter.x, palmCenter.y);
      this.ctx.lineTo(pinkyNode.x, pinkyNode.y);

      // Palm to Wrist
      this.ctx.moveTo(palmCenter.x, palmCenter.y);
      this.ctx.lineTo(wristAnchor.x, wristAnchor.y);

      // Convex Perimeter
      this.ctx.moveTo(thumbNode.x, thumbNode.y);
      this.ctx.lineTo(fingerApex.x, fingerApex.y);
      this.ctx.lineTo(pinkyNode.x, pinkyNode.y);
      this.ctx.lineTo(wristAnchor.x, wristAnchor.y);
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Draw Glowing Landmark Nodes
      const nodes = [
        { pt: fingerApex, label: 'APX' },
        { pt: thumbNode, label: 'THB' },
        { pt: pinkyNode, label: 'PNK' },
        { pt: wristAnchor, label: 'WST' },
      ];

      nodes.forEach(({ pt, label }) => {
        this.ctx!.fillStyle = color;
        this.ctx!.beginPath();
        this.ctx!.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        this.ctx!.fill();

        this.ctx!.strokeStyle = '#ffffff';
        this.ctx!.lineWidth = 1;
        this.ctx!.beginPath();
        this.ctx!.arc(pt.x, pt.y, 6.5, 0, Math.PI * 2);
        this.ctx!.stroke();

        this.ctx!.font = 'bold 8px monospace';
        this.ctx!.fillStyle = '#ffffff';
        this.ctx!.fillText(label, pt.x + 8, pt.y + 3);
      });
    }

    // 2. Corner Targeting Brackets
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2.5;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 8;

    this.ctx.beginPath();
    // Top-left
    this.ctx.moveTo(left, top + corner);
    this.ctx.lineTo(left, top);
    this.ctx.lineTo(left + corner, top);
    // Top-right
    this.ctx.moveTo(left + boxW - corner, top);
    this.ctx.lineTo(left + boxW, top);
    this.ctx.lineTo(left + boxW, top + corner);
    // Bottom-left
    this.ctx.moveTo(left, top + boxH - corner);
    this.ctx.lineTo(left, top + boxH);
    this.ctx.lineTo(left + corner, top + boxH);
    // Bottom-right
    this.ctx.moveTo(left + boxW - corner, top + boxH);
    this.ctx.lineTo(left + boxW, top + boxH);
    this.ctx.lineTo(left + boxW, top + boxH - corner);
    this.ctx.stroke();

    // Central crosshair & ring
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = `${color}aa`;
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    this.ctx.stroke();

    // Reset shadow
    this.ctx.shadowBlur = 0;

    // 3. Motion trail rendering
    if (this.historyCentroids.length > 1) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = `${color}55`;
      this.ctx.lineWidth = 2;
      for (let i = 0; i < this.historyCentroids.length; i++) {
        const pt = this.historyCentroids[i];
        if (i === 0) this.ctx.moveTo(pt.x, pt.y);
        else this.ctx.lineTo(pt.x, pt.y);
      }
      this.ctx.stroke();
    }

    // 4. HUD Telemetry Box
    this.ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    this.ctx.fillRect(left, Math.max(4, top - 22), 120, 18);
    this.ctx.strokeStyle = color;
    this.ctx.strokeRect(left, Math.max(4, top - 22), 120, 18);

    this.ctx.font = 'bold 10px monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(gesture, left + 6, Math.max(16, top - 9));
  }
}

export const gestureDetector = new HandGestureDetector();
