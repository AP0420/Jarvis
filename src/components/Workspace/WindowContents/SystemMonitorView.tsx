import React, { useState, useEffect } from 'react';
import { WorkspaceWindow } from '../../../types';
import { useSupercomputer } from '../../../context/SupercomputerContext';
import { Cpu, Activity, ShieldCheck, Database, Layers, Radio } from 'lucide-react';
import { extensionBridge, ExtensionStatus } from '../../../services/extensionBridge';

interface Props {
  windowItem: WorkspaceWindow;
}

export const SystemMonitorView: React.FC<Props> = () => {
  const { windows, memories, reminders, customCommands, coreState } = useSupercomputer();
  const [extStatus, setExtStatus] = useState<ExtensionStatus>({ isInstalled: false });
  const [simMetrics, setSimMetrics] = useState({
    fps: 60,
    memoryMb: 142,
    cpuUsage: 12,
  });

  useEffect(() => {
    const unsub = extensionBridge.subscribe(setExtStatus);
    const interval = setInterval(() => {
      setSimMetrics({
        fps: Math.round(58 + Math.random() * 4),
        memoryMb: Math.round(135 + windows.length * 12 + Math.random() * 5),
        cpuUsage: coreState === 'RESEARCHING' || coreState === 'THINKING' ? Math.round(45 + Math.random() * 20) : Math.round(8 + Math.random() * 6),
      });
    }, 1500);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [windows.length, coreState]);

  return (
    <div className="flex flex-col h-full space-y-3 text-slate-200 text-xs font-mono">
      {/* Header telemetry cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px]">CPU SIM</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="text-base font-bold text-cyan-300 mt-1">{simMetrics.cpuUsage}%</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px]">HEAP MEM</span>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-base font-bold text-emerald-300 mt-1">{simMetrics.memoryMb} MB</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px]">FRAME RATE</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <span className="text-base font-bold text-sky-300 mt-1">{simMetrics.fps} FPS</span>
        </div>
      </div>

      {/* Subsystem Status Matrix */}
      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
        <div className="text-[11px] font-semibold text-slate-400 border-b border-slate-850 pb-1 flex items-center justify-between">
          <span>AI & WORKSPACE SUBSYSTEMS</span>
          <span className="text-emerald-400 text-[10px]">ALL SYSTEMS NOMINAL</span>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Primary AI Engine:</span>
            <span className="text-cyan-300">Gemini 3.7 Flash</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Search Grounding:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Enabled (Live Google Web)
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Audio Speech Engine:</span>
            <span className="text-sky-300">Web Speech + Gemini TTS</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Companion Extension:</span>
            <span className={extStatus.isInstalled ? 'text-emerald-400' : 'text-amber-400'}>
              {extStatus.isInstalled ? 'Connected (v1.0)' : 'Standalone Web Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Resources Stats */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>OPEN WINDOWS</span>
          </div>
          <span className="text-xl font-bold text-slate-200 mt-2">{windows.length}</span>
          <span className="text-[10px] text-slate-500">Active in Workspace</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>MEMORY NODES</span>
          </div>
          <span className="text-xl font-bold text-slate-200 mt-2">{memories.length}</span>
          <span className="text-[10px] text-slate-500">Persistent Facts</span>
        </div>
      </div>
    </div>
  );
};
