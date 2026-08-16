import React, { useState, useRef, useEffect } from 'react';
import { useSupercomputer } from '../../context/SupercomputerContext';
import { faceStructureDetector } from '../../utils/faceStructureDetector';
import { soundFx } from '../../utils/soundFx';
import {
  Users,
  Camera,
  X,
  Plus,
  Trash2,
  Check,
  UserCheck,
  Sparkles,
  Shield,
  Eye,
  RefreshCw,
  Clock,
  HeartHandshake,
  Scan,
} from 'lucide-react';
import { PeopleProfile } from '../../types';

interface PeopleModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const PeopleModal: React.FC<PeopleModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const {
    isPeopleModalOpen,
    setPeopleModalOpen,
    peopleProfiles,
    addPersonProfile,
    deletePersonProfile,
    recognizedPerson,
    speakText,
    userProfile,
  } = useSupercomputer();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isPeopleModalOpen;
  const onClose = propOnClose || (() => setPeopleModalOpen(false));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'enroll'>('list');

  // Enrollment Form State
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Best Friend');
  const [customRelation, setCustomRelation] = useState('');
  const [description, setDescription] = useState('');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [capturedDescriptors, setCapturedDescriptors] = useState<any[]>([]);
  const [captureStep, setCaptureStep] = useState<number>(1);
  const [enrollStatus, setEnrollStatus] = useState<string>('');

  const RELATION_PRESETS = [
    'Self / Boss',
    'Best Friend',
    'Sister',
    'Brother',
    'Mother',
    'Father',
    'Partner',
    'Colleague',
    'Mentor',
    'Custom',
  ];

  // Start enrollment camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.warn('[PeopleModal] Camera access error:', err);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Real-time animation loop for biometric reticle preview
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (videoRef.current && canvasRef.current && isCameraActive) {
        const result = faceStructureDetector.detectAndRecognize(
          videoRef.current,
          canvasRef.current,
          peopleProfiles,
          performance.now()
        );

        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          if (result.detected && result.landmarks) {
            faceStructureDetector.drawFaceReticle(
              ctx,
              result.landmarks,
              result.matchedPerson,
              result.confidence
            );
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    if (isOpen) {
      animId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, isCameraActive, peopleProfiles]);

  const handleCaptureAngle = () => {
    if (!videoRef.current) return;

    soundFx.playCameraSnap();
    const snap = faceStructureDetector.captureSnapshot(videoRef.current);
    if (!snap) return;

    const nextPhotos = [...capturedPhotos, snap.photoBase64];
    const nextDescriptors = [...capturedDescriptors, snap.descriptor];
    setCapturedPhotos(nextPhotos);
    setCapturedDescriptors(nextDescriptors);

    if (captureStep === 1) {
      setCaptureStep(2);
      setEnrollStatus('Front angle saved! Now tilt head slightly left for 3D facial structure.');
    } else if (captureStep === 2) {
      setCaptureStep(3);
      setEnrollStatus('Left angle saved! Now tilt head slightly right.');
    } else {
      setEnrollStatus('All 3 angles captured! Multi-angle biometric profile mapped.');
    }
  };

  const handleSavePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalRelation = relation === 'Custom' ? customRelation.trim() || 'Companion' : relation;

    // Use primary captured descriptor or default
    let descriptor = capturedDescriptors[0] || {
      faceRatio: 0.85,
      eyeSpanRatio: 0.44,
      chinNoseRatio: 0.4,
      skinHueAvg: 110,
      colorHistogram: new Array(16).fill(0.0625),
    };

    if (videoRef.current && capturedDescriptors.length === 0) {
      const snap = faceStructureDetector.captureSnapshot(videoRef.current);
      if (snap) {
        descriptor = snap.descriptor;
      }
    }

    const newProfile: PeopleProfile = {
      id: `person-${Date.now()}`,
      name: name.trim(),
      relation: finalRelation,
      description: description.trim() || `${finalRelation} of ${userProfile.userName}`,
      photos: capturedPhotos.length > 0 ? capturedPhotos : [],
      faceDescriptor: descriptor,
      multiAngleDescriptors: capturedDescriptors.length > 0 ? capturedDescriptors : [descriptor],
      createdAt: Date.now(),
    };

    addPersonProfile(newProfile);
    soundFx.playWakeChirp();
    speakText(`Face structure biometric profile registered for ${newProfile.name}. I'll greet them whenever I see them.`);

    // Reset form
    setName('');
    setDescription('');
    setCapturedPhotos([]);
    setCapturedDescriptors([]);
    setCaptureStep(1);
    setEnrollStatus('');
    setActiveTab('list');
  };

  const handleTestGreeting = (person: PeopleProfile) => {
    soundFx.playWakeChirp();
    const hours = new Date().getHours();
    const timeGreeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';
    speakText(`${timeGreeting} ${person.name}! How are you doing? Have you had your meal yet?`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl h-[640px] rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden text-slate-200 font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-700/60 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono text-slate-100 tracking-wider uppercase">
                  PEOPLE & FACE STRUCTURE BIOMETRICS
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-[10px] font-mono text-cyan-300">
                  {peopleProfiles.length} ENROLLED
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                Teach JARVIS to recognize your family, friends, and colleagues via multi-angle face structure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'list'
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>My People ({peopleProfiles.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('enroll')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'enroll'
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enroll New Person</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Recognition Status Strip */}
        <div className="px-5 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">CAMERA STATUS:</span>
            {recognizedPerson ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                IDENTIFIED: {recognizedPerson.name} ({recognizedPerson.relation})
              </span>
            ) : isCameraActive ? (
              <span className="text-cyan-400">Scanning for faces... (Mirror Feed Active)</span>
            ) : (
              <span className="text-amber-400">Camera inactive</span>
            )}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted On-Device Biometric Hash</span>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* TAB 1: ENROLLED PEOPLE LIST */}
          {activeTab === 'list' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {peopleProfiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h3 className="text-base font-bold text-slate-100">No People Enrolled Yet</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Enroll yourself, family, or friends by taking quick face photos. JARVIS will recognize them, greet them by name, and tailor conversations to them!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('enroll')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Enroll First Person</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {peopleProfiles.map((person) => (
                    <div
                      key={person.id}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        {/* Profile Photo Thumbnail */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-cyan-500/40 flex-shrink-0 flex items-center justify-center">
                          {person.photos && person.photos.length > 0 ? (
                            <img
                              src={person.photos[0]}
                              alt={person.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-slate-600" />
                          )}
                          <span className="absolute bottom-1 right-1 px-1 rounded bg-slate-950/90 text-[8px] font-mono text-cyan-300">
                            {person.photos?.length || 1} 📷
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-100 truncate">{person.name}</h4>
                            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] font-mono text-cyan-300">
                              {person.relation}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{person.description}</p>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {person.lastSeen
                              ? `Seen ${new Date(person.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : 'Ready for scanning'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTestGreeting(person)}
                            className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 transition-colors cursor-pointer text-[10px] flex items-center gap-1"
                            title="Test JARVIS custom greeting"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Test Greeting</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePersonProfile(person.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete Person Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENROLL PERSON WIZARD */}
          {activeTab === 'enroll' && (
            <div className="flex-1 p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Camera Viewport with Biometric Reticle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    <span>Face Structure Scanner</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">Step {captureStep} of 3</span>
                </div>

                {/* Camera Viewport (Mirrored) */}
                <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 filter brightness-105 contrast-105"
                  />

                  {/* Biometric Hologram Canvas Overlay */}
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={224}
                    className="absolute inset-0 w-full h-full object-cover block pointer-events-none z-10"
                  />

                  {/* Target Guide Ring */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-36 h-48 rounded-full border border-dashed border-cyan-400/40 animate-pulse" />
                  </div>

                  {/* Prompt Banner */}
                  <div className="absolute bottom-2 inset-x-2 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-cyan-500/60 font-mono text-[11px] text-cyan-300 text-center backdrop-blur-md z-20">
                    {captureStep === 1
                      ? '📸 Step 1: Look straight into the camera (Front Angle)'
                      : captureStep === 2
                      ? '📸 Step 2: Tilt face slightly LEFT'
                      : '📸 Step 3: Tilt face slightly RIGHT'}
                  </div>
                </div>

                {/* Capture Action & Photos Gallery */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureAngle}
                    className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Angle {captureStep}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPhotos([]);
                      setCaptureStep(1);
                      setEnrollStatus('');
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                    title="Reset photo captures"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Thumbnail Previews */}
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="h-16 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden relative"
                    >
                      {capturedPhotos[idx] ? (
                        <>
                          <img
                            src={capturedPhotos[idx]}
                            alt={`Angle ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 px-1 rounded bg-slate-950/90 text-[8px] font-mono text-emerald-400">
                            ✓ Angle {idx + 1}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-600">Angle {idx + 1}</span>
                      )}
                    </div>
                  ))}
                </div>

                {enrollStatus && (
                  <p className="text-[11px] font-mono text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
                    {enrollStatus}
                  </p>
                )}
              </div>

              {/* Right Column: Person Profile Form */}
              <form onSubmit={handleSavePerson} className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">Person Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. A.P., Sarah, Mom, Dr. Alex"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {/* Relationship Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">Relationship to You *</label>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                    {RELATION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRelation(preset)}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer truncate ${
                          relation === preset
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {relation === 'Custom' && (
                    <input
                      type="text"
                      value={customRelation}
                      onChange={(e) => setCustomRelation(e.target.value)}
                      placeholder="Specify custom relation (e.g. Project Lead, Gym Partner)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono mt-1"
                    />
                  )}
                </div>

                {/* Personality & Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">
                    About Them / Personality & Interests (Guides JARVIS Conversations)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Software engineer working on autonomous robotics, loves espresso, likes concise morning updates..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans resize-none text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save & Enroll Biometric Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
