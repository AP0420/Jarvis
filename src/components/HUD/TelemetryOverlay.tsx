import React, { useState, useEffect } from 'react';
import { useSupercomputer } from '../../context/SupercomputerContext';
import {
  ShieldCheck,
  Radio,
  Volume2,
  VolumeX,
  Clock,
  Cpu,
  Brain,
  User,
  Sliders,
} from 'lucide-react';

export const TelemetryOverlay: React.FC = () => {
  const {
    userProfile,
    updateProfile,
    isVoiceActive,
    memories,
    windows,
    setCommandCenterOpen,
  } = useSupercomputer();

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [tzStr, setTzStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const userTz = userProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const isIndia = userTz.includes('Kolkata') || userTz.includes('Calcutta') || userTz.includes('India');

      setTimeStr(
        now.toLocaleTimeString([], {
          hour12: false,
          timeZone: userTz,
        })
      );
      setDateStr(
        now.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          timeZone: userTz,
        })
      );
      setTzStr(isIndia ? 'IST' : userTz.split('/').pop()?.replace(/_/g, ' ') || 'LOCAL');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [userProfile.timezone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-20 select-none">
      {/* Top Left HUD Telemetry */}
      <div className="absolute top-3 left-4 pointer-events-auto flex items-center gap-3 font-mono text-xs text-slate-400">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-850 backdrop-blur-md shadow-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="font-bold text-slate-100 tracking-wider">
            {userProfile.assistantName} OS
          </span>
          <span className="text-[10px] text-cyan-400/80 px-1 py-0.5 rounded bg-cyan-950 border border-cyan-850">
            v4.2
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-850 backdrop-blur-md text-[11px]">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-100 font-semibold">{timeStr}</span>
          <span className="text-[10px] text-cyan-400 px-1 py-0.2 rounded bg-cyan-950/70 border border-cyan-800/60 font-mono">
            {tzStr}
          </span>
          <span className="text-slate-600">•</span>
          <span>{dateStr}</span>
        </div>
      </div>

      {/* Top Right HUD Telemetry */}
      <div className="absolute top-3 right-4 pointer-events-auto flex items-center gap-2 font-mono text-xs">
        {/* Sound FX Toggle */}
        <button
          type="button"
          onClick={() => updateProfile({ soundEffectsEnabled: !userProfile.soundEffectsEnabled })}
          className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 transition-colors backdrop-blur-md flex items-center gap-1.5 cursor-pointer text-[11px]"
          title={userProfile.soundEffectsEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
        >
          {userProfile.soundEffectsEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span className="hidden sm:inline">
            {userProfile.soundEffectsEnabled ? 'AUDIO ON' : 'MUTED'}
          </span>
        </button>

        {/* Wake Word Status Chip */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-850 backdrop-blur-md text-[11px] text-slate-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>WAKE:</span>
          <span className="text-cyan-300">"{userProfile.wakeWord}"</span>
        </div>

        {/* User Identity Pill (Clickable to open settings) */}
        <button
          type="button"
          onClick={() => setCommandCenterOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-cyan-950/60 border border-slate-850 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all backdrop-blur-md flex items-center gap-1.5 cursor-pointer text-[11px]"
          title="Open Profile & Settings"
        >
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold">{userProfile.userName}</span>
        </button>
      </div>
    </div>
  );
};
