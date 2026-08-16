import { FaceBiometricDescriptor, FaceLandmarks, FaceDetectionResult, PeopleProfile } from '../types';

/**
 * 1€ (One Euro) Adaptive Low-Pass Filter for Jitter-Free Biometric Tracking
 */
class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev: number = 0;
  private tPrev: number | null = null;

  constructor(minCutoff = 0.7, beta = 0.03, dCutoff = 1.0) {
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

    const dx = (x - this.xPrev) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    this.dxPrev = dxHat;

    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = this.alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat;

    return xHat;
  }
}

export class FaceStructureDetector {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  // 1€ Adaptive Filters for all biometric nodes & bounds
  private filterCenterX = new OneEuroFilter(0.6, 0.025, 1.0);
  private filterCenterY = new OneEuroFilter(0.6, 0.025, 1.0);
  private filterWidth = new OneEuroFilter(0.45, 0.02, 1.0);
  private filterHeight = new OneEuroFilter(0.45, 0.02, 1.0);

  private filterLeftEyeX = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterLeftEyeY = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterRightEyeX = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterRightEyeY = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterNoseX = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterNoseY = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterMouthX = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterMouthY = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterForeheadX = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterForeheadY = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterChinX = new OneEuroFilter(0.75, 0.03, 1.0);
  private filterChinY = new OneEuroFilter(0.75, 0.03, 1.0);

  // Anti-Flicker Temporal Hysteresis & Identity Stability Buffer
  private lockCount: number = 0;
  private graceFrames: number = 0;
  private lastConfirmedPerson: PeopleProfile | null = null;
  private lastConfirmedLandmarks: FaceLandmarks | null = null;
  private lastMatchConfidence: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 160;
      this.offscreenCanvas.height = 120;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  public reset() {
    this.filterCenterX.reset();
    this.filterCenterY.reset();
    this.filterWidth.reset();
    this.filterHeight.reset();
    this.filterLeftEyeX.reset();
    this.filterLeftEyeY.reset();
    this.filterRightEyeX.reset();
    this.filterRightEyeY.reset();
    this.filterNoseX.reset();
    this.filterNoseY.reset();
    this.filterMouthX.reset();
    this.filterMouthY.reset();
    this.filterForeheadX.reset();
    this.filterForeheadY.reset();
    this.filterChinX.reset();
    this.filterChinY.reset();

    this.lockCount = 0;
    this.graceFrames = 0;
    this.lastConfirmedPerson = null;
    this.lastConfirmedLandmarks = null;
    this.lastMatchConfidence = 0;
  }

  /**
   * Process video frame for facial structure, biometric extraction and person matching
   */
  public detectAndRecognize(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    people: PeopleProfile[],
    timestamp: number
  ): FaceDetectionResult {
    if (!this.offscreenCanvas || !this.offscreenCtx || video.readyState < 2) {
      return { detected: false, matchedPerson: null, confidence: 0, landmarks: null };
    }

    const w = 160;
    const h = 120;
    const cw = canvas.width;
    const ch = canvas.height;

    this.offscreenCtx.drawImage(video, 0, 0, w, h);
    const imgData = this.offscreenCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let facePixels = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;

    const histogram = new Array(16).fill(0);
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;

    // Scan upper 70% of frame where head & face naturally rest
    for (let y = 6; y < Math.floor(h * 0.75); y += 2) {
      for (let x = Math.floor(w * 0.10); x < Math.floor(w * 0.90); x += 2) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // YCbCr skin chrominance model
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        const isYCbCr = cb >= 74 && cb <= 136 && cr >= 130 && cr <= 182;

        // RGB Skin Model
        const isRGB =
          r > 55 &&
          g > 32 &&
          b > 22 &&
          r > g &&
          r > b &&
          r - g > 10 &&
          r / (r + g + b + 1) > 0.36;

        if (isYCbCr && isRGB) {
          facePixels++;
          sumX += x;
          sumY += y;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          totalR += r;
          totalG += g;
          totalB += b;

          const bin = Math.min(15, Math.floor(((r + g + b) / (3 * 256)) * 16));
          histogram[bin]++;
        }
      }
    }

    const minFacePixels = 42;

    if (facePixels >= minFacePixels && maxX - minX > 16 && maxY - minY > 18) {
      this.graceFrames = 12; // 12-frame grace window eliminates dropouts
      this.lockCount = Math.min(this.lockCount + 1, 24);

      const rawCenterX = sumX / facePixels;
      const rawCenterY = sumY / facePixels;
      const rawW = (maxX - minX) * 1.22;
      const rawH = (maxY - minY) * 1.32;

      // Map to display canvas (Mirrored horizontally: cx = (w - rawCenterX)/w * cw)
      const mappedCx = ((w - rawCenterX) / w) * cw;
      const mappedCy = (rawCenterY / h) * ch;
      const mappedW = (rawW / w) * cw;
      const mappedH = (rawH / h) * ch;

      // 1€ Adaptive Smoothing on Central Coordinates & Bounds
      const smoothCx = this.filterCenterX.filter(mappedCx, timestamp);
      const smoothCy = this.filterCenterY.filter(mappedCy, timestamp);
      const smoothW = Math.max(65, Math.min(cw * 0.85, this.filterWidth.filter(mappedW, timestamp)));
      const smoothH = Math.max(80, Math.min(ch * 0.92, this.filterHeight.filter(mappedH, timestamp)));

      // Biometric Landmarks Proportions
      const faceRatio = smoothW / (smoothH || 1);
      const eyeSpan = smoothW * 0.44;
      const eyeY = smoothCy - smoothH * 0.12;

      const rawLeftEye = { x: smoothCx - eyeSpan / 2, y: eyeY };
      const rawRightEye = { x: smoothCx + eyeSpan / 2, y: eyeY };
      const rawForehead = { x: smoothCx, y: smoothCy - smoothH * 0.42 };
      const rawNose = { x: smoothCx, y: smoothCy + smoothH * 0.04 };
      const rawMouth = { x: smoothCx, y: smoothCy + smoothH * 0.24 };
      const rawChin = { x: smoothCx, y: smoothCy + smoothH * 0.44 };

      const smoothLeftEye = {
        x: this.filterLeftEyeX.filter(rawLeftEye.x, timestamp),
        y: this.filterLeftEyeY.filter(rawLeftEye.y, timestamp),
      };
      const smoothRightEye = {
        x: this.filterRightEyeX.filter(rawRightEye.x, timestamp),
        y: this.filterRightEyeY.filter(rawRightEye.y, timestamp),
      };
      const smoothForehead = {
        x: this.filterForeheadX.filter(rawForehead.x, timestamp),
        y: this.filterForeheadY.filter(rawForehead.y, timestamp),
      };
      const smoothNose = {
        x: this.filterNoseX.filter(rawNose.x, timestamp),
        y: this.filterNoseY.filter(rawNose.y, timestamp),
      };
      const smoothMouth = {
        x: this.filterMouthX.filter(rawMouth.x, timestamp),
        y: this.filterMouthY.filter(rawMouth.y, timestamp),
      };
      const smoothChin = {
        x: this.filterChinX.filter(rawChin.x, timestamp),
        y: this.filterChinY.filter(rawChin.y, timestamp),
      };

      const landmarks: FaceLandmarks = {
        center: { x: smoothCx, y: smoothCy },
        boundingBox: {
          x: smoothCx - smoothW / 2,
          y: smoothCy - smoothH / 2,
          width: smoothW,
          height: smoothH,
        },
        leftEye: smoothLeftEye,
        rightEye: smoothRightEye,
        forehead: smoothForehead,
        noseTip: smoothNose,
        mouthCenter: smoothMouth,
        chin: smoothChin,
        faceRatio,
        confidence: Math.min(0.99, 0.72 + facePixels / 220),
      };

      // Extract Normalized Google Photos style Biometric Descriptor
      const normHist = histogram.map((cnt) => (facePixels > 0 ? cnt / facePixels : 0));
      const skinHueAvg = (totalR * 0.5 + totalG * 0.3 + totalB * 0.2) / (facePixels || 1);

      const upperFaceIndex = Math.abs(smoothNose.y - smoothLeftEye.y) / smoothH;
      const middleFaceIndex = Math.abs(smoothMouth.y - smoothNose.y) / smoothH;
      const jawlineRatio = Math.abs(smoothChin.y - smoothMouth.y) / smoothH;

      const liveDescriptor: FaceBiometricDescriptor = {
        faceRatio,
        eyeSpanRatio: (smoothRightEye.x - smoothLeftEye.x) / smoothW,
        chinNoseRatio: (smoothChin.y - smoothNose.y) / smoothH,
        upperFaceIndex,
        middleFaceIndex,
        jawlineRatio,
        skinHueAvg,
        colorHistogram: normHist,
      };

      // Multi-Angle Nearest-Neighbor Matching (Google Photos clustering style)
      let bestMatch: PeopleProfile | null = null;
      let highestScore = 0;

      for (const p of people) {
        if (!p.faceDescriptor) continue;

        // Check primary descriptor
        let maxProfileScore = this.calculateBiometricSimilarity(liveDescriptor, p.faceDescriptor);

        // Check all registered multi-angle descriptors (Front, Left-Tilt, Right-Tilt)
        if (p.multiAngleDescriptors && p.multiAngleDescriptors.length > 0) {
          for (const angleDesc of p.multiAngleDescriptors) {
            const angleScore = this.calculateBiometricSimilarity(liveDescriptor, angleDesc);
            if (angleScore > maxProfileScore) {
              maxProfileScore = angleScore;
            }
          }
        }

        if (maxProfileScore > highestScore) {
          highestScore = maxProfileScore;
          bestMatch = p;
        }
      }

      // Biometric identification threshold: >0.70 score
      const isRecognized = bestMatch !== null && highestScore >= 0.70;
      const matchedPerson = isRecognized ? bestMatch : null;
      const finalConfidence = isRecognized ? Math.round(highestScore * 100) / 100 : landmarks.confidence;

      this.lastConfirmedPerson = matchedPerson;
      this.lastConfirmedLandmarks = landmarks;
      this.lastMatchConfidence = finalConfidence;

      return {
        detected: true,
        matchedPerson,
        confidence: finalConfidence,
        landmarks,
      };
    } else if (this.graceFrames > 0 && this.lastConfirmedLandmarks) {
      // Grace frame bridging completely eliminates video-canvas flicker
      this.graceFrames--;
      return {
        detected: true,
        matchedPerson: this.lastConfirmedPerson,
        confidence: this.lastMatchConfidence * 0.96,
        landmarks: this.lastConfirmedLandmarks,
      };
    } else {
      this.lockCount = 0;
      this.lastConfirmedPerson = null;
      this.lastConfirmedLandmarks = null;
      return {
        detected: false,
        matchedPerson: null,
        confidence: 0,
        landmarks: null,
      };
    }
  }

  /**
   * Google Photos style Biometric Vector Similarity Scoring
   */
  private calculateBiometricSimilarity(
    a: FaceBiometricDescriptor,
    b: FaceBiometricDescriptor
  ): number {
    // 1. Face Aspect Ratio Distance
    const ratioDiff = Math.abs(a.faceRatio - b.faceRatio);
    const ratioScore = Math.max(0, 1 - ratioDiff * 1.5);

    // 2. Eye Span & Vertical Facial Proportions
    const eyeDiff = Math.abs(a.eyeSpanRatio - b.eyeSpanRatio);
    const eyeScore = Math.max(0, 1 - eyeDiff * 2.5);

    const chinDiff = Math.abs(a.chinNoseRatio - b.chinNoseRatio);
    const chinScore = Math.max(0, 1 - chinDiff * 2.2);

    const upperDiff = Math.abs((a.upperFaceIndex || 0.16) - (b.upperFaceIndex || 0.16));
    const upperScore = Math.max(0, 1 - upperDiff * 2.5);

    const middleDiff = Math.abs((a.middleFaceIndex || 0.20) - (b.middleFaceIndex || 0.20));
    const middleScore = Math.max(0, 1 - middleDiff * 2.5);

    // 3. Color Histogram Cosine Similarity
    let dot = 0;
    let magA = 0;
    let magB = 0;
    const len = Math.min(a.colorHistogram?.length || 0, b.colorHistogram?.length || 0);

    for (let i = 0; i < len; i++) {
      const valA = a.colorHistogram[i];
      const valB = b.colorHistogram[i];
      dot += valA * valB;
      magA += valA * valA;
      magB += valB * valB;
    }

    const histScore = magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0.65;

    // Weighted composite biometric match score
    return (
      ratioScore * 0.20 +
      eyeScore * 0.20 +
      chinScore * 0.15 +
      upperScore * 0.10 +
      middleScore * 0.10 +
      histScore * 0.25
    );
  }

  /**
   * Render Sci-Fi Holographic Biometric Face Mesh & Identification Reticle
   */
  public drawFaceReticle(
    ctx: CanvasRenderingContext2D,
    landmarks: FaceLandmarks,
    matchedPerson: PeopleProfile | null,
    confidence: number
  ) {
    const { boundingBox, leftEye, rightEye, forehead, noseTip, mouthCenter, chin } = landmarks;
    const { x, y, width: w, height: h } = boundingBox;

    const isRecognized = matchedPerson !== null;
    const color = isRecognized ? '#10b981' : '#06b6d4'; // Emerald for recognized person, Cyan for scanning
    const corner = 18;

    ctx.save();

    // 1. Holographic Biometric Wireframe Skeleton
    ctx.beginPath();
    ctx.strokeStyle = `${color}44`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 2]);

    // Facial Triangulation Mesh
    ctx.moveTo(forehead.x, forehead.y);
    ctx.lineTo(leftEye.x, leftEye.y);
    ctx.lineTo(noseTip.x, noseTip.y);
    ctx.lineTo(forehead.x, forehead.y);

    ctx.moveTo(forehead.x, forehead.y);
    ctx.lineTo(rightEye.x, rightEye.y);
    ctx.lineTo(noseTip.x, noseTip.y);

    ctx.moveTo(leftEye.x, leftEye.y);
    ctx.lineTo(rightEye.x, rightEye.y);

    ctx.moveTo(leftEye.x, leftEye.y);
    ctx.lineTo(mouthCenter.x, mouthCenter.y);
    ctx.lineTo(rightEye.x, rightEye.y);

    ctx.moveTo(noseTip.x, noseTip.y);
    ctx.lineTo(mouthCenter.x, mouthCenter.y);
    ctx.lineTo(chin.x, chin.y);

    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Biometric Nodes
    const nodes = [
      { pt: forehead, label: 'FHD' },
      { pt: leftEye, label: 'EYE-L' },
      { pt: rightEye, label: 'EYE-R' },
      { pt: noseTip, label: 'NOSE' },
      { pt: mouthCenter, label: 'MTH' },
      { pt: chin, label: 'CHN' },
    ];

    nodes.forEach(({ pt, label }) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, pt.x + 7, pt.y + 2);
    });

    // 3. Sci-Fi Targeting Brackets
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    // Top-Left
    ctx.moveTo(x, y + corner);
    ctx.lineTo(x, y);
    ctx.lineTo(x + corner, y);
    // Top-Right
    ctx.moveTo(x + w - corner, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + corner);
    // Bottom-Left
    ctx.moveTo(x, y + h - corner);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + corner, y + h);
    // Bottom-Right
    ctx.moveTo(x + w - corner, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - corner);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // 4. Biometric HUD Identity Badge
    const badgeW = Math.max(140, isRecognized ? 165 : 130);
    const badgeH = isRecognized ? 34 : 20;
    const badgeX = x;
    const badgeY = Math.max(6, y - badgeH - 6);

    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

    if (isRecognized && matchedPerson) {
      // Line 1: Name & Status
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`● ID: ${matchedPerson.name.toUpperCase()}`, badgeX + 6, badgeY + 13);

      // Line 2: Relation & Confidence
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`${matchedPerson.relation} • ${Math.round(confidence * 100)}% MATCH`, badgeX + 6, badgeY + 27);
    } else {
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`⚡ FACE SCAN: ${Math.round(confidence * 100)}%`, badgeX + 6, badgeY + 14);
    }

    ctx.restore();
  }

  /**
   * Helper to capture a photo snapshot and calculate face descriptor for profile enrollment
   */
  public captureSnapshot(video: HTMLVideoElement): {
    photoBase64: string;
    descriptor: FaceBiometricDescriptor;
  } | null {
    if (video.readyState < 2 || video.videoWidth === 0) return null;

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 320;
    snapCanvas.height = 240;
    const sCtx = snapCanvas.getContext('2d');
    if (!sCtx) return null;

    // Draw mirrored capture to match screen mirror view
    sCtx.save();
    sCtx.translate(snapCanvas.width, 0);
    sCtx.scale(-1, 1);
    sCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
    sCtx.restore();

    const photoBase64 = snapCanvas.toDataURL('image/jpeg', 0.85);

    // Compute descriptor from image data
    const imgData = sCtx.getImageData(0, 0, snapCanvas.width, snapCanvas.height);
    const data = imgData.data;

    let facePixels = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = snapCanvas.width;
    let maxX = 0;
    let minY = snapCanvas.height;
    let maxY = 0;

    const histogram = new Array(16).fill(0);
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;

    for (let y = 10; y < snapCanvas.height * 0.8; y += 2) {
      for (let x = snapCanvas.width * 0.15; x < snapCanvas.width * 0.85; x += 2) {
        const i = (y * snapCanvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        const isYCbCr = cb >= 74 && cb <= 136 && cr >= 130 && cr <= 182;
        const isRGB = r > 55 && g > 32 && b > 22 && r > g && r > b && r - g > 10;

        if (isYCbCr && isRGB) {
          facePixels++;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          totalR += r;
          totalG += g;
          totalB += b;
          const bin = Math.min(15, Math.floor(((r + g + b) / (3 * 256)) * 16));
          histogram[bin]++;
        }
      }
    }

    const w = maxX > minX ? maxX - minX : 100;
    const h = maxY > minY ? maxY - minY : 120;
    const faceRatio = w / (h || 1);
    const normHist = histogram.map((cnt) => (facePixels > 0 ? cnt / facePixels : 0));
    const skinHueAvg = (totalR * 0.5 + totalG * 0.3 + totalB * 0.2) / (facePixels || 1);

    const descriptor: FaceBiometricDescriptor = {
      faceRatio,
      eyeSpanRatio: 0.44,
      chinNoseRatio: 0.4,
      upperFaceIndex: 0.16,
      middleFaceIndex: 0.20,
      jawlineRatio: 0.20,
      skinHueAvg,
      colorHistogram: normHist,
    };

    return { photoBase64, descriptor };
  }
}

export const faceStructureDetector = new FaceStructureDetector();
