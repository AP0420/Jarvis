import React, { useState } from 'react';
import { useSupercomputer } from '../../context/SupercomputerContext';
import {
  Mic,
  MicOff,
  Sparkles,
  Radio,
  Zap,
  Hand,
  Sliders,
  Send,
  Languages,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const CentralCore: React.FC = () => {
  const {
    coreState,
    statusMessage,
    isVoiceActive,
    setVoiceActive,
    audioFrequencyData,
    windows,
    userProfile,
    updateProfile,
    processUserInput,
    transcript,
    gestureMode,
    setGestureMode,
    gestureToast,
    selectedLanguage,
    setSelectedLanguage,
    setCommandCenterOpen,
  } = useSupercomputer();

  const [inputVal, setInputVal] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Compute average audio level from frequency visualizer
  const avgAudio =
    audioFrequencyData.reduce((acc, val) => acc + val, 0) / (audioFrequencyData.length || 1);
  const audioScale = Math.min(1.35, 1 + avgAudio / 170);

  // State-specific theme colors
  const getStateConfig = () => {
    switch (coreState) {
      case 'LISTENING':
        return {
          ringColor: 'border-emerald-500/80 shadow-[0_0_50px_rgba(16,185,129,0.6)]',
          coreBg: 'from-emerald-950/80 via-emerald-900/40 to-black',
          textColor: 'text-emerald-400',
          accent: 'emerald',
        };
      case 'THINKING':
        return {
          ringColor: 'border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.6)]',
          coreBg: 'from-amber-950/80 via-amber-900/40 to-black',
          textColor: 'text-amber-400',
          accent: 'amber',
        };
      case 'RESEARCHING':
        return {
          ringColor: 'border-cyan-500/80 shadow-[0_0_55px_rgba(6,182,212,0.7)]',
          coreBg: 'from-cyan-950/80 via-cyan-900/40 to-black',
          textColor: 'text-cyan-400',
          accent: 'cyan',
        };
      case 'EXECUTING':
        return {
          ringColor: 'border-violet-500/80 shadow-[0_0_50px_rgba(139,92,246,0.7)]',
          coreBg: 'from-violet-950/80 via-violet-900/40 to-black',
          textColor: 'text-violet-400',
          accent: 'violet',
        };
      case 'SPEAKING':
        return {
          ringColor: 'border-sky-400/90 shadow-[0_0_60px_rgba(56,189,248,0.8)]',
          coreBg: 'from-sky-950/90 via-sky-900/50 to-black',
          textColor: 'text-sky-300',
          accent: 'sky',
        };
      case 'ERROR':
        return {
          ringColor: 'border-rose-500/80 shadow-[0_0_50px_rgba(244,63,94,0.7)]',
          coreBg: 'from-rose-950/80 via-rose-900/40 to-black',
          textColor: 'text-rose-400',
          accent: 'rose',
        };
      case 'IDLE':
      default:
        return {
          ringColor: 'border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.3)]',
          coreBg: 'from-cyan-950/50 via-slate-900/30 to-black',
          textColor: 'text-cyan-400/90',
          accent: 'cyan',
        };
    }
  };

  const stateStyle = getStateConfig();
  const isWorkspaceBusy = windows.length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const text = inputVal.trim();
    setInputVal('');
    processUserInput(text);
  };

  const handleQuickChat = (prompt: string) => {
    soundFx.playBlip();
    processUserInput(prompt);
  };

  const toggleVoiceGender = () => {
    soundFx.playBlip();
    const nextGender = userProfile.voiceGender === 'female' ? 'male' : 'female';
    const nextVoice = nextGender === 'female' ? 'Kore' : 'Zephyr';
    updateProfile({
      voiceGender: nextGender,
      assistantVoice: nextVoice,
    });
  };

  const languages = [
    { code: 'auto', label: 'Auto Detect (Multilingual)' },
    { code: 'en-US', label: 'English (US / Global)' },
    { code: 'hi-IN', label: 'Hindi / हिन्दी' },
    { code: 'es-ES', label: 'Spanish / Español' },
    { code: 'fr-FR', label: 'French / Français' },
    { code: 'de-DE', label: 'German / Deutsch' },
    { code: 'ja-JP', label: 'Japanese / 日本語' },
    { code: 'zh-CN', label: 'Chinese / 中文' },
    { code: 'ar-SA', label: 'Arabic / العربية' },
  ];

  return (
    <div
      className={`fixed inset-0 pointer-events-none flex flex-col items-center justify-center transition-all duration-700 select-none ${
        isWorkspaceBusy ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{ zIndex: 1 }}
    >
      {/* Gesture Action Toast Feedback */}
      {gestureToast && (
        <div className="absolute top-20 z-50 pointer-events-auto px-4 py-2 rounded-full bg-slate-950/95 border border-cyan-400 text-cyan-300 font-mono text-xs shadow-[0_0_30px_rgba(6,182,212,0.5)] animate-bounce flex items-center gap-2">
          <Hand className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-bold">{gestureToast}</span>
        </div>
      )}

      {/* Outer Holographic AI Voice Ring System */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex flex-col items-center justify-center">
        {/* Ambient Radial Glow */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700"
          style={{
            background:
              coreState === 'SPEAKING'
                ? 'radial-gradient(circle, #38bdf8 0%, transparent 70%)'
                : coreState === 'RESEARCHING'
                ? 'radial-gradient(circle, #06b6d4 0%, transparent 70%)'
                : coreState === 'LISTENING'
                ? 'radial-gradient(circle, #10b981 0%, transparent 70%)'
                : 'radial-gradient(circle, #0284c7 0%, transparent 70%)',
          }}
        />

        {/* Orbit Ring 1 (Dashed) */}
        <div
          className="absolute inset-0 rounded-full border border-cyan-500/15 border-dashed"
          style={{ animation: 'spin 45s linear infinite' }}
        />

        {/* Orbit Ring 2 */}
        <div
          className="absolute inset-5 rounded-full border border-sky-500/20"
          style={{
            borderStyle: 'double',
            animation: 'spin 30s linear infinite reverse',
          }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
        </div>

        {/* Orbit Ring 3 (Reactive Scale) */}
        <div
          className={`absolute inset-10 rounded-full border-2 ${stateStyle.ringColor} transition-all duration-300`}
          style={{ transform: `scale(${audioScale})` }}
        />

        {/* Central Glowing AI Voice Core Module (Click to Talk) */}
        <button
          type="button"
          onClick={() => setVoiceActive(!isVoiceActive)}
          className={`pointer-events-auto relative w-48 h-48 rounded-full bg-gradient-to-br ${stateStyle.coreBg} backdrop-blur-2xl border border-cyan-500/40 flex flex-col items-center justify-center p-4 transition-all duration-300 hover:scale-105 hover:border-cyan-400 group cursor-pointer focus:outline-none shadow-2xl`}
          title={isVoiceActive ? 'Click to pause voice listening' : 'Click to talk or say "Awake" / "Hey Jarvis"'}
        >
          {/* Audio Waveform Equalizer */}
          {(isVoiceActive || coreState === 'SPEAKING' || coreState === 'RESEARCHING') && (
            <div className="absolute -top-5 flex items-center justify-center gap-0.5 h-6 pointer-events-none">
              {Array.from({ length: 16 }).map((_, idx) => {
                const val = audioFrequencyData[idx * 2] || 10;
                const h = Math.max(3, (val / 255) * 20);
                return (
                  <div
                    key={idx}
                    className="w-1 bg-cyan-400/90 rounded-full transition-all duration-75"
                    style={{ height: `${h}px` }}
                  />
                );
              })}
            </div>
          )}

          {/* Center Dynamic Icon */}
          <div className="relative flex items-center justify-center mb-1">
            {isVoiceActive ? (
              <Mic className="w-10 h-10 text-emerald-400 animate-pulse drop-shadow-[0_0_15px_rgba(52,211,153,0.9)]" />
            ) : coreState === 'RESEARCHING' ? (
              <Zap className="w-10 h-10 text-cyan-300 animate-bounce drop-shadow-[0_0_15px_rgba(34,211,238,0.9)]" />
            ) : coreState === 'SPEAKING' ? (
              <Radio className="w-10 h-10 text-sky-300 animate-pulse drop-shadow-[0_0_15px_rgba(56,189,248,0.9)]" />
            ) : (
              <Sparkles className="w-10 h-10 text-cyan-400/90 group-hover:text-cyan-200 transition-colors drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            )}
          </div>

          {/* Voice Module Label */}
          <div className="text-[11px] font-mono tracking-[0.25em] text-slate-300 uppercase font-bold">
            {userProfile.assistantName}
          </div>

          {/* State Text */}
          <div
            className={`text-xs font-mono font-bold tracking-wider ${stateStyle.textColor} transition-colors uppercase mt-0.5`}
          >
            {statusMessage.length > 20 ? `${statusMessage.slice(0, 18)}...` : statusMessage}
          </div>

          {/* Live Wake Word Status */}
          <div className="text-[9px] font-mono text-cyan-300/80 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>SAY "AWAKE" OR TALK</span>
          </div>
        </button>

        {/* Lower Integrated Voice Controls & Telemetry */}
        <div className="absolute -bottom-10 pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-300 shadow-2xl backdrop-blur-xl">
          {/* Male / Female Voice Toggle Button */}
          <button
            type="button"
            onClick={toggleVoiceGender}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
              userProfile.voiceGender === 'female'
                ? 'text-pink-300 bg-pink-950/60 border border-pink-700/60 font-semibold'
                : 'text-cyan-300 bg-cyan-950/60 border border-cyan-700/60 font-semibold'
            }`}
            title="Click to toggle Male Voice (JARVIS) or Female Voice (FRIDAY)"
          >
            <span>{userProfile.voiceGender === 'female' ? '👩 Female Voice' : '👨 Male Voice'}</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-1 hover:text-cyan-300 cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-900 transition-colors"
              title="Change Voice Recognition & Speech Language"
            >
              <Languages className="w-3 h-3 text-cyan-400" />
              <span>{selectedLanguage === 'auto' ? 'Multilingual' : selectedLanguage.slice(0, 2).toUpperCase()}</span>
            </button>

            {showLanguageMenu && (
              <div className="absolute bottom-8 left-0 w-48 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-2xl p-1.5 space-y-1 z-50">
                <div className="text-[9px] text-slate-400 px-2 py-1 uppercase font-bold border-b border-slate-800">
                  Voice Language
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(l.code);
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-[10px] flex items-center justify-between hover:bg-slate-900 cursor-pointer ${
                      selectedLanguage === l.code ? 'text-cyan-400 bg-slate-900/80 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-slate-700">|</span>

          {/* Gesture Mode Quick Toggle */}
          <button
            type="button"
            onClick={() => setGestureMode(!gestureMode)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
              gestureMode ? 'text-cyan-300 bg-cyan-950 border border-cyan-700' : 'hover:text-cyan-300 hover:bg-slate-900'
            }`}
            title="Toggle Hand Gesture Camera HUD"
          >
            <Hand className="w-3 h-3 text-cyan-400" />
            <span>{gestureMode ? 'GESTURES ON' : 'GESTURES'}</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Personality / Settings */}
          <button
            type="button"
            onClick={() => setCommandCenterOpen(true)}
            className="flex items-center gap-1 hover:text-cyan-300 cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-900 transition-colors"
            title="Assistant Voice & Personality Settings"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>{userProfile.assistantVoice}</span>
          </button>
        </div>

        {/* Talk with Gemini Quick Conversation Chips (when idle or few windows) */}
        {!isWorkspaceBusy && (
          <div className="absolute -bottom-24 pointer-events-auto flex items-center gap-2 flex-wrap justify-center max-w-lg">
            <button
              type="button"
              onClick={() => handleQuickChat('Hello! Tell me an interesting scientific fact and how you can help me today.')}
              className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/60 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-lg backdrop-blur-md flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>💬 "Tell me a cool science fact"</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickChat('How are you feeling today JARVIS? Let us talk.')}
              className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/60 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-lg backdrop-blur-md flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>💬 "How are you doing today?"</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickChat('Explain quantum entanglement simply.')}
              className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/60 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-lg backdrop-blur-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>💬 "Explain Quantum Physics"</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
