import React, { useState } from 'react';
import { useSupercomputer } from '../../context/SupercomputerContext';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  LayoutGrid,
  Columns,
  Maximize,
  Sliders,
  Hand,
  Sun,
  Activity,
  Chrome,
  Trash2,
  Layers,
  Languages,
  Users,
} from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const CommandBar: React.FC = () => {
  const {
    isVoiceActive,
    setVoiceActive,
    processUserInput,
    transcript,
    interimTranscript,
    setLayout,
    layout,
    gestureMode,
    setGestureMode,
    setCommandCenterOpen,
    setExtensionModalOpen,
    setPeopleModalOpen,
    createNewWindow,
    closeAllResearchWindows,
    triggerDailyGreeting,
    userProfile,
  } = useSupercomputer();

  const [inputVal, setInputVal] = useState('');
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const text = inputVal.trim();
    setInputVal('');
    processUserInput(text);
  };

  const handleChipClick = (cmd: string) => {
    soundFx.playBlip();
    processUserInput(cmd);
  };

  const handleOpenSystemMonitor = () => {
    createNewWindow('SYSTEM_MONITOR', 'JARVIS System Monitor', {}, undefined, {
      width: 480,
      height: 380,
    });
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 p-3 sm:p-4 flex flex-col items-center pointer-events-none">
      {/* Live Voice Speech Transcript Bubble */}
      {(transcript || interimTranscript || isVoiceActive) && (
        <div className="pointer-events-auto mb-2 px-4 py-2 rounded-full bg-slate-950/90 border border-cyan-500/40 text-xs font-mono text-cyan-300 shadow-2xl backdrop-blur-xl flex items-center gap-2 max-w-xl truncate animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="text-slate-400">SPEECH:</span>
          <span className="text-slate-100 truncate">
            {interimTranscript || transcript || `Listening... (say "${userProfile.wakeWord || 'Awake'}")`}
          </span>
        </div>
      )}

      {/* Main Command Hub Bar */}
      <div className="pointer-events-auto w-full max-w-3xl bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 hover:border-cyan-500/50 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-2xl p-2 transition-all">
        {/* Top Input Row */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Voice Microphone Toggle Button */}
          <button
            type="button"
            onClick={() => setVoiceActive(!isVoiceActive)}
            className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isVoiceActive
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                : 'bg-slate-900 border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300'
            }`}
            title={isVoiceActive ? 'Mute voice recognition' : 'Activate voice control (or say "Awake" / "Hey Jarvis")'}
          >
            {isVoiceActive ? (
              <>
                <Mic className="w-5 h-5 animate-pulse text-emerald-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </>
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>

          {/* Text Command Input */}
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800/80 focus-within:border-cyan-500/60 transition-colors">
            <Sparkles className="w-4 h-4 text-cyan-400/80 flex-shrink-0" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={`Say "Awake", ask in any language, "Open YouTube", research topics...`}
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            />
            {inputVal && (
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Layout Selector Popover Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLayoutOpen(!isLayoutOpen)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
              title="Arrange workspace layout"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            {isLayoutOpen && (
              <div className="absolute bottom-12 right-0 w-44 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl p-1.5 space-y-1 font-mono text-xs z-40 backdrop-blur-xl">
                <div className="text-[10px] text-slate-500 px-2 py-1 uppercase">Workspace Layouts</div>
                <button
                  type="button"
                  onClick={() => {
                    setLayout('freeform');
                    setIsLayoutOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                    layout === 'freeform' ? 'text-cyan-400 bg-slate-900' : 'text-slate-300'
                  }`}
                >
                  <span>Freeform</span>
                  <Layers className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayout('side_by_side');
                    setIsLayoutOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                    layout === 'side_by_side' ? 'text-cyan-400 bg-slate-900' : 'text-slate-300'
                  }`}
                >
                  <span>Side by Side</span>
                  <Columns className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayout('grid');
                    setIsLayoutOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                    layout === 'grid' ? 'text-cyan-400 bg-slate-900' : 'text-slate-300'
                  }`}
                >
                  <span>Grid Matrix</span>
                  <LayoutGrid className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayout('focus');
                    setIsLayoutOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                    layout === 'focus' ? 'text-cyan-400 bg-slate-900' : 'text-slate-300'
                  }`}
                >
                  <span>Focus Center</span>
                  <Maximize className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayout('stack');
                    setIsLayoutOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                    layout === 'stack' ? 'text-cyan-400 bg-slate-900' : 'text-slate-300'
                  }`}
                >
                  <span>Cascading Stack</span>
                  <Layers className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Hand Gesture Mode Toggle */}
          <button
            type="button"
            onClick={() => setGestureMode(!gestureMode)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              gestureMode
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'bg-slate-900 border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-slate-200'
            }`}
            title={gestureMode ? 'Disable camera gesture tracking' : 'Enable computer vision hand gestures'}
          >
            <Hand className="w-4 h-4" />
          </button>

          {/* Assistant Command Center Settings Modal Trigger */}
          <button
            type="button"
            onClick={() => setCommandCenterOpen(true)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
            title="Open Assistant Command Center (Settings, Memory, Commands, Voice)"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </form>

        {/* Bottom Quick Chips Bar */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-850/80 overflow-x-auto text-[11px] font-mono scrollbar-none">
          {/* Quick Trigger Chips */}
          <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto">
            <span className="text-slate-500 text-[10px] uppercase mr-1 hidden sm:inline">QUICK:</span>
            <button
              type="button"
              onClick={() => handleChipClick('Awake')}
              className="px-2 py-0.5 rounded-full bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 hover:text-cyan-100 border border-cyan-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              🎙️ Wake Up / Awake
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('Open YouTube')}
              className="px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              🌐 Open YouTube
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('Research AI agents and autonomous reasoning')}
              className="px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              🔍 AI Agents Intel
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('Assemble')}
              className="px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              ⚡ Assemble Protocol
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('Compare React with Vue 3')}
              className="px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              📊 Compare React vs Vue
            </button>
            <button
              type="button"
              onClick={() => handleChipClick('I had 2 boiled eggs, avocado toast and black coffee')}
              className="px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              🥑 Log Meal / Nutrition
            </button>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setPeopleModalOpen(true)}
              className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-colors cursor-pointer"
              title="People & Multi-Angle Biometrics (Family, Friends, Colleagues)"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={triggerDailyGreeting}
              className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Trigger Daily Briefing & Nutrition Check"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleOpenSystemMonitor}
              className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Open Live Supercomputer System Monitor"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setExtensionModalOpen(true)}
              className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Browser Extension Bridge Packager"
            >
              <Chrome className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={closeAllResearchWindows}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Close all research windows"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
