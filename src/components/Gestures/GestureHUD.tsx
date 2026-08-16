import React, { useRef, useEffect, useState, memo } from 'react';
import { useSupercomputer } from '../../context/SupercomputerContext';
import { gestureDetector, GestureEngineTelemetry } from '../../utils/gestureDetector';
import { faceStructureDetector } from '../../utils/faceStructureDetector';
import { soundFx } from '../../utils/soundFx';
import {
  Hand,
  CameraOff,
  X,
  Sliders,
  Shield,
  Volume2,
  VolumeX,
  Sparkles,
  Activity,
  Cpu,
  Eye,
  CheckCircle2,
  Users,
  UserCheck,
  Scan,
} from 'lucide-react';

export const GestureHUD: React.FC = memo(() => {
  const {
    gestureMode,
    setGestureMode,
    activeGesture,
    setActiveGesture,
    userProfile,
    updateProfile,
    peopleProfiles,
    recognizedPerson,
    setRecognizedPerson,
    setIsFaceDetected,
    setPeopleModalOpen,
  } = useSupercomputer();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [faceDetectedInFrame, setFaceDetectedInFrame] = useState(false);

  // Audio Synthesizer Controller State
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(soundFx.isSoundEnabled());
  const [audioVolume, setAudioVolume] = useState<number>(soundFx.getVolume());
  const [audioPulseActive, setAudioPulseActive] = useState(false);

  // Frame Throttling & Landmark Settings State
  const [targetFps, setTargetFpsState] = useState<number>(30);
  const [showLandmarks, setShowLandmarksState] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<GestureEngineTelemetry>({
    fps: 30,
    processTimeMs: 1.8,
    landmarkNodes: 5,
    jitterRms: 0.3,
    throttleIntervalMs: 33,
  });

  const toggleSound = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    soundFx.setEnabled(nextState);
    if (nextState) {
      soundFx.playHandLockOn();
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    soundFx.setVolume(vol);
  };

  const handleFpsChange = (fps: number) => {
    setTargetFpsState(fps);
    gestureDetector.setTargetFps(fps);
  };

  const handleLandmarksToggle = () => {
    const next = !showLandmarks;
    setShowLandmarksState(next);
    gestureDetector.setShowLandmarks(next);
  };

  useEffect(() => {
    if (activeGesture && activeGesture !== 'NONE') {
      setAudioPulseActive(true);
      const timer = setTimeout(() => setAudioPulseActive(false), 550);
      return () => clearTimeout(timer);
    }
  }, [activeGesture]);

  useEffect(() => {
    if (!gestureMode) {
      gestureDetector.stop();
      setIsCameraActive(false);
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      gestureDetector.setSensitivity(userProfile.gestureSensitivity || 6);
      gestureDetector.setTargetFps(targetFps);
      gestureDetector.setShowLandmarks(showLandmarks);
      gestureDetector.setTelemetryCallback((t) => {
        if (isMounted) {
          setTelemetry(t);
        }
      });

      // Hook up Face Structure Detector as synchronized post-render pass on the same canvas
      gestureDetector.setPostRenderCallback((ctx, canvas, video, timestamp) => {
        if (!isMounted) return;

        const faceResult = faceStructureDetector.detectAndRecognize(
          video,
          canvas,
          peopleProfiles,
          timestamp
        );

        if (faceResult.detected && faceResult.landmarks) {
          setFaceDetectedInFrame(true);
          setIsFaceDetected(true);
          faceStructureDetector.drawFaceReticle(
            ctx,
            faceResult.landmarks,
            faceResult.matchedPerson,
            faceResult.confidence
          );

          if (faceResult.matchedPerson && faceResult.confidence >= 0.70) {
            setRecognizedPerson(faceResult.matchedPerson, faceResult.confidence);
          } else {
            setRecognizedPerson(null, faceResult.confidence);
          }
        } else {
          setFaceDetectedInFrame(false);
          setIsFaceDetected(false);
          setRecognizedPerson(null, 0);
        }
      });

      const ok = await gestureDetector.start(
        videoRef.current,
        canvasRef.current,
        (result) => {
          if (isMounted) {
            setActiveGesture(result.gesture, result.confidence);
          }
        }
      );

      if (isMounted) {
        setIsCameraActive(ok);
        if (!ok) {
          setCameraError('Camera access required. Please allow camera permissions.');
        } else {
          setCameraError(null);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      gestureDetector.setPostRenderCallback(null);
      gestureDetector.stop();
    };
  }, [
    gestureMode,
    userProfile.gestureSensitivity,
    setActiveGesture,
    targetFps,
    showLandmarks,
    peopleProfiles,
    setRecognizedPerson,
  ]);

  if (!gestureMode) return null;

  return (
    <div className="fixed top-16 right-4 z-20 w-88 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.3)] p-3 space-y-2.5 select-none transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wider">
          <Hand className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>VISION & BIOMETRIC ENGINE</span>
        </div>
        <div className="flex items-center gap-1">
          {/* People & Face Biometrics Modal Trigger */}
          <button
            type="button"
            onClick={() => setPeopleModalOpen(true)}
            className="p-1 rounded transition-colors cursor-pointer text-cyan-400 hover:text-cyan-200 bg-cyan-950/60 border border-cyan-800/60"
            title="Manage Enrolled People & Multi-angle Face Structures"
          >
            <Users className="w-3.5 h-3.5" />
          </button>

          {/* Audio Controller Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isAudioEnabled
                ? 'text-cyan-400 hover:text-cyan-200 bg-cyan-950/60'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={isAudioEnabled ? 'Mute synthesized sound effects' : 'Enable synthesized sound effects'}
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded transition-colors cursor-pointer ${
              showSettings ? 'text-cyan-300 bg-slate-800' : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
            title="Calibrate 1€ filter, frame rate throttling & sound FX"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Close HUD */}
          <button
            type="button"
            onClick={() => setGestureMode(false)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Close Vision Camera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video & Canvas Viewport */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-inner flex items-center justify-center">
        {/* Hardware-accelerated smooth camera video (mirrored) */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 filter brightness-105 contrast-105"
        />

        {/* High-tech tint overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30 pointer-events-none" />

        {/* Overlay Canvas for Holographic Sci-Fi HUD Reticles & 1€ Smoothed Landmarks */}
        <canvas
          ref={canvasRef}
          width={352}
          height={192}
          className="absolute inset-0 w-full h-full object-cover block pointer-events-none z-10"
        />

        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-3 text-center text-xs text-rose-400 space-y-1.5 z-20">
            <CameraOff className="w-6 h-6 text-rose-500" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Recognized Person or Face Detection Live Status */}
        <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-slate-950/90 border border-cyan-500/60 font-mono text-[9px] text-cyan-300 flex items-center gap-1.5 backdrop-blur-md">
          {recognizedPerson ? (
            <>
              <UserCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">{recognizedPerson.name} ({recognizedPerson.relation})</span>
            </>
          ) : faceDetectedInFrame ? (
            <>
              <Scan className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Face Structure Locked</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              <span>1€ Smooth Engine</span>
            </>
          )}
        </div>

        {/* Live Detected Hand Gesture Badge */}
        <div className="absolute bottom-2 left-2 z-20 px-2.5 py-1 rounded-md bg-slate-950/90 border border-cyan-500/70 font-mono text-[10px] text-cyan-300 flex items-center gap-1.5 shadow-lg backdrop-blur-md">
          <span
            className={`w-2 h-2 rounded-full ${
              activeGesture !== 'NONE' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
            }`}
          />
          <span className="font-semibold">
            {activeGesture !== 'NONE' ? activeGesture : 'SHOW HAND IN FRAME'}
          </span>
        </div>

        {/* Web Audio Synthesizer Acoustic Feedback Indicator */}
        <div
          className={`absolute bottom-2 right-2 z-20 px-2 py-0.5 rounded-md font-mono text-[9px] flex items-center gap-1 backdrop-blur-md transition-all duration-200 border ${
            audioPulseActive && isAudioEnabled
              ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.6)] scale-105'
              : 'bg-slate-950/80 border-slate-800 text-slate-400'
          }`}
        >
          <Activity
            className={`w-3 h-3 ${
              audioPulseActive && isAudioEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
            }`}
          />
          <span>{isAudioEnabled ? (audioPulseActive ? 'AUDIO PULSE' : 'SYNTH READY') : 'MUTED'}</span>
        </div>
      </div>

      {/* Live Telemetry Bar */}
      <div className="grid grid-cols-4 gap-1 py-1 px-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[9px] font-mono text-slate-300">
        <div className="flex flex-col">
          <span className="text-slate-500 uppercase text-[8px]">Vision FPS</span>
          <span className="text-cyan-400 font-bold">{telemetry.fps} FPS</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 uppercase text-[8px]">Latency</span>
          <span className="text-emerald-400 font-bold">{telemetry.processTimeMs}ms</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 uppercase text-[8px]">Biometrics</span>
          <span className="text-purple-400 font-bold">{peopleProfiles.length} Profiles</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 uppercase text-[8px]">Jitter RMS</span>
          <span className="text-amber-400 font-bold">{telemetry.jitterRms}px</span>
        </div>
      </div>

      {/* Settings Panel: 1€ Filter, Throttling & Web Audio Synth */}
      {showSettings && (
        <div className="p-2.5 rounded-lg bg-slate-900/95 border border-slate-800 space-y-2.5 text-xs font-mono">
          {/* Tracking Sensitivity */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>TRACKING SENSITIVITY:</span>
              <span className="text-cyan-400 font-bold">{userProfile.gestureSensitivity || 6}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={userProfile.gestureSensitivity || 6}
              onChange={(e) => updateProfile({ gestureSensitivity: parseInt(e.target.value, 10) })}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Camera Frame Throttling Preset */}
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>FRAME RATE THROTTLING:</span>
              </span>
              <span className="text-cyan-400 font-bold">{targetFps} FPS ({Math.round(1000 / targetFps)}ms)</span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              {[
                { fps: 20, label: '20 FPS (Eco)' },
                { fps: 30, label: '30 FPS (Opt)' },
                { fps: 60, label: '60 FPS (Max)' },
              ].map((item) => (
                <button
                  key={item.fps}
                  type="button"
                  onClick={() => handleFpsChange(item.fps)}
                  className={`py-1 rounded text-[10px] cursor-pointer transition-colors border ${
                    targetFps === item.fps
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Holographic Landmark Skeleton Overlay Toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <span className="flex items-center gap-1 text-slate-300">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>SKELETAL BONES & LANDMARKS:</span>
            </span>
            <button
              type="button"
              onClick={handleLandmarksToggle}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                showLandmarks
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {showLandmarks ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Web Audio Synthesizer Volume & FX Chain */}
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-cyan-400" />
                <span>SYNTH ACOUSTIC VOLUME:</span>
              </span>
              <span className="text-cyan-400 font-bold">{Math.round(audioVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Audio Synthesizer Test Trigger */}
          <div className="flex items-center justify-between pt-1 text-[10px]">
            <span className="text-slate-400">TEST WEB AUDIO SYNTH:</span>
            <button
              type="button"
              onClick={() => {
                soundFx.playHandLockOn();
                soundFx.playGestureAction('SPREAD');
              }}
              className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold cursor-pointer transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>TEST CHIME</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Action to Manage People */}
      <button
        type="button"
        onClick={() => setPeopleModalOpen(true)}
        className="w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-[10px] font-mono text-cyan-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
      >
        <Users className="w-3 h-3" />
        <span>Manage People & Face Structures ({peopleProfiles.length})</span>
      </button>

      {/* Audio Engine & Security isolation status */}
      <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/50">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 flex-shrink-0" />
          <span>1€ Adaptive Filter • Zero Jitter</span>
        </div>
        <span className="text-cyan-400 font-bold">Face + Hand Vision</span>
      </div>
    </div>
  );
});

GestureHUD.displayName = 'GestureHUD';

