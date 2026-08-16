import React, { useState } from 'react';
import { useSupercomputer } from '../../context/SupercomputerContext';
import {
  X,
  User,
  Volume2,
  Brain,
  Terminal,
  Bell,
  Shield,
  Trash2,
  Plus,
  Check,
  Sparkles,
  Sliders,
  Radio,
  Download,
  Users,
} from 'lucide-react';
import { CustomCommand, MemoryItem } from '../../types';

export const CommandCenterModal: React.FC = () => {
  const {
    isCommandCenterOpen,
    setCommandCenterOpen,
    setPeopleModalOpen,
    userProfile,
    updateProfile,
    memories,
    addMemory,
    deleteMemory,
    customCommands,
    saveCommand,
    deleteCommand,
    reminders,
    deleteReminder,
    speakText,
  } = useSupercomputer();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'voice' | 'memory' | 'commands' | 'reminders' | 'privacy'
  >('profile');

  // Form states for adding items
  const [newMemText, setNewMemText] = useState('');
  const [newMemCat, setNewMemCat] = useState<'preference' | 'fact' | 'project'>('fact');

  const [cmdTrigger, setCmdTrigger] = useState('');
  const [cmdTitle, setCmdTitle] = useState('');
  const [cmdDesc, setCmdDesc] = useState('');
  const [cmdActionType, setCmdActionType] = useState<'OPEN_TAB' | 'RESEARCH_TOPIC' | 'VOICE_SPEAK'>('OPEN_TAB');
  const [cmdActionVal, setCmdActionVal] = useState('');

  if (!isCommandCenterOpen) return null;

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemText.trim()) return;
    addMemory(newMemText.trim(), newMemCat);
    setNewMemText('');
  };

  const handleAddCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdTrigger.trim() || !cmdTitle.trim() || !cmdActionVal.trim()) return;

    let actionObj: any;
    if (cmdActionType === 'OPEN_TAB') {
      actionObj = { type: 'OPEN_TAB', url: cmdActionVal.trim(), label: cmdTitle.trim() };
    } else if (cmdActionType === 'RESEARCH_TOPIC') {
      actionObj = { type: 'RESEARCH_TOPIC', query: cmdActionVal.trim() };
    } else {
      actionObj = { type: 'VOICE_SPEAK', message: cmdActionVal.trim() };
    }

    const newCmd: CustomCommand = {
      id: `cmd-${Date.now()}`,
      trigger: cmdTrigger.trim().toLowerCase(),
      title: cmdTitle.trim(),
      description: cmdDesc.trim() || `Workflow for ${cmdTitle.trim()}`,
      actions: [actionObj],
      isEnabled: true,
      createdAt: Date.now(),
    };

    saveCommand(newCmd);
    setCmdTrigger('');
    setCmdTitle('');
    setCmdDesc('');
    setCmdActionVal('');
  };

  const handleTestVoice = () => {
    speakText(`Testing voice synthesis for ${userProfile.assistantName}. All channels operational.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl h-[620px] rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden text-slate-200 font-sans">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-slate-100 tracking-wider uppercase">
                ASSISTANT COMMAND CENTER
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                Core configuration, voice biometrics, persistent memory, and automation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCommandCenterOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation & Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-slate-800/80 bg-slate-950/90 p-2 space-y-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Identity</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'voice'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice & Audio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('memory')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'memory'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Memory Bank</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('commands')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'commands'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Workflows</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reminders')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'reminders'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Reminders</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy & Data</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-5 overflow-y-auto bg-slate-950/60">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase">
                    USER & ASSISTANT IDENTITY
                  </h3>
                  <p className="text-slate-400">
                    Configure how the AI addresses you and behaves during interactions.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 uppercase">Full User Name</label>
                    <input
                      type="text"
                      value={userProfile.userName}
                      onChange={(e) => updateProfile({ userName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 uppercase">Preferred Spoken Nickname</label>
                    <input
                      type="text"
                      value={userProfile.userNickname || 'A.P.'}
                      onChange={(e) => updateProfile({ userNickname: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      placeholder="e.g. A.P., Aryan, Boss"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 uppercase">
                      Phonetic Pronunciation Guide
                    </label>
                    <input
                      type="text"
                      value={userProfile.userPronunciation}
                      onChange={(e) => updateProfile({ userPronunciation: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      placeholder="e.g. AH-ree-yahn"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 uppercase">
                      Assistant Name
                    </label>
                    <input
                      type="text"
                      value={userProfile.assistantName}
                      onChange={(e) => updateProfile({ assistantName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 uppercase">
                      Timezone & Region
                    </label>
                    <select
                      value={userProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'}
                      onChange={(e) => updateProfile({ timezone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST - India Standard Time +5:30)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST +9:00)</option>
                      <option value="Europe/London">Europe/London (GMT/BST +0:00/+1:00)</option>
                      <option value="Europe/Paris">Europe/Paris (CET +1:00)</option>
                      <option value="America/New_York">America/New_York (EST/EDT -5:00/-4:00)</option>
                      <option value="America/Chicago">America/Chicago (CST/CDT -6:00/-5:00)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT -8:00/-7:00)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST +10:00)</option>
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 uppercase">
                      Location / City
                    </label>
                    <input
                      type="text"
                      value={userProfile.location || 'India'}
                      onChange={(e) => updateProfile({ location: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      placeholder="e.g. India, Bangalore, Mumbai, Delhi"
                    />
                  </div>
                </div>

                {/* People & Multi-Angle Biometrics Banner */}
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-900/60 text-cyan-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-mono text-cyan-300">People & Multi-Angle Face Biometrics</h4>
                      <p className="text-[10px] text-slate-400">
                        Enroll and recognize friends, family, and colleagues automatically with custom greetings.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCommandCenterOpen(false);
                      setPeopleModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Manage People</span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">
                    AI Persona Style
                  </label>
                  <div className="grid grid-cols-4 gap-2 font-mono">
                    {(['Intelligent', 'Tactical', 'Witty', 'Formal'] as const).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => updateProfile({ personality: style })}
                        className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                          userProfile.personality === style
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-slate-300">Daily Morning Briefing</span>
                    <p className="text-[11px] text-slate-500">
                      Deliver an ambient status greeting with scheduled tasks on first interaction.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={userProfile.dailyGreetingEnabled}
                    onChange={(e) => updateProfile({ dailyGreetingEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* VOICE TAB */}
            {activeTab === 'voice' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase">
                      GEMINI LIVE 3.1 & NEURAL TTS AUDIO ENGINE
                    </h3>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Powered by Google Gemini 3.1 Live API (<code className="text-cyan-300">gemini-3.1-flash-live-preview</code>) and Gemini Neural TTS (<code className="text-cyan-300">gemini-3.1-flash-tts-preview</code>) for sub-second real-time voice streaming, tool execution, and neural speech.
                  </p>
                </div>

                {/* Voice Gender Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">
                    Voice Persona Timbre
                  </label>
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <button
                      type="button"
                      onClick={() => updateProfile({ voiceGender: 'male', assistantVoice: 'Zephyr' })}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        userProfile.voiceGender === 'male'
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👨</span>
                        <div className="text-left">
                          <div className="font-bold">MALE PERSONA</div>
                          <div className="text-[10px] text-slate-400">Deep, calm & authoritative (JARVIS)</div>
                        </div>
                      </div>
                      {userProfile.voiceGender === 'male' && <Check className="w-4 h-4 text-cyan-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => updateProfile({ voiceGender: 'female', assistantVoice: 'Kore' })}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        userProfile.voiceGender === 'female'
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👩</span>
                        <div className="text-left">
                          <div className="font-bold">FEMALE PERSONA</div>
                          <div className="text-[10px] text-slate-400">Warm, articulate & melodic (FRIDAY)</div>
                        </div>
                      </div>
                      {userProfile.voiceGender === 'female' && <Check className="w-4 h-4 text-cyan-400" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-slate-400 uppercase">
                    Gemini Live Prebuilt Voice Models
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                    {[
                      { name: 'Zephyr', role: 'Calm & Articulate (Default)', gender: 'male', desc: 'Futuristic AI Voice' },
                      { name: 'Puck', role: 'Playful & Conversational', gender: 'male', desc: 'Energetic Companion' },
                      { name: 'Charon', role: 'Deep & Authoritative', gender: 'male', desc: 'Command Resonance' },
                      { name: 'Kore', role: 'Warm & Melodious', gender: 'female', desc: 'Intuitive & Friendly' },
                      { name: 'Fenrir', role: 'Crisp & Tactical', gender: 'male', desc: 'Fast & Direct' },
                      { name: 'Samantha', role: 'Classic Natural Voice', gender: 'female', desc: 'Smooth Synthesis' },
                    ].map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() =>
                          updateProfile({
                            assistantVoice: v.name as any,
                            voiceGender: v.gender as any,
                          })
                        }
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          userProfile.assistantVoice === v.name
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold shadow-lg shadow-cyan-950'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold">{v.name}</span>
                          {userProfile.assistantVoice === v.name && (
                            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[10px] text-cyan-400/90 block mt-0.5">{v.role}</span>
                        <span className="text-[9px] text-slate-500 block">{v.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Speech Rate:</span>
                      <span className="text-cyan-400">{userProfile.speechRate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={userProfile.speechRate}
                      onChange={(e) => updateProfile({ speechRate: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Speech Pitch:</span>
                      <span className="text-cyan-400">{userProfile.speechPitch}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.2"
                      step="0.05"
                      value={userProfile.speechPitch}
                      onChange={(e) => updateProfile({ speechPitch: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-slate-300">Sci-Fi Acoustic Sound FX</span>
                    <p className="text-[11px] text-slate-500">
                      Play futuristic UI audio feedback on commands, window snaps, and data feeds.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={userProfile.soundEffectsEnabled}
                    onChange={(e) => updateProfile({ soundEffectsEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-medium flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Test Voice Synthesis</span>
                  </button>
                </div>
              </div>
            )}

            {/* MEMORY BANK TAB */}
            {activeTab === 'memory' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase">
                    PERSISTENT MEMORY BANK ({memories.length})
                  </h3>
                  <p className="text-slate-400">
                    Information the assistant explicitly remembers about your preferences and projects.
                  </p>
                </div>

                {/* Add memory form */}
                <form onSubmit={handleAddMemory} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono text-slate-300 font-semibold">Store New Memory:</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMemText}
                      onChange={(e) => setNewMemText(e.target.value)}
                      placeholder="e.g. I work primarily in TypeScript and WebAssembly..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                    <select
                      value={newMemCat}
                      onChange={(e) => setNewMemCat(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 focus:outline-none font-mono"
                    >
                      <option value="fact">Fact</option>
                      <option value="preference">Preference</option>
                      <option value="project">Project</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!newMemText.trim()}
                      className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                </form>

                {/* Memory list */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {memories.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-mono">
                      No persistent memories stored yet.
                    </div>
                  ) : (
                    memories.map((mem) => (
                      <div
                        key={mem.id}
                        className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-850">
                              {mem.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(mem.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-sans">{mem.content}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteMemory(mem.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Forget memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* WORKFLOWS / COMMANDS TAB */}
            {activeTab === 'commands' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase">
                    CUSTOM WORKFLOW AUTOMATION
                  </h3>
                  <p className="text-slate-400">
                    Create custom voice triggers and multi-step browser macros.
                  </p>
                </div>

                {/* Add Command Form */}
                <form onSubmit={handleAddCommand} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono text-slate-300 font-semibold">Create Custom Macro:</div>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <input
                      type="text"
                      value={cmdTrigger}
                      onChange={(e) => setCmdTrigger(e.target.value)}
                      placeholder="Voice trigger (e.g. daily setup)"
                      className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      value={cmdTitle}
                      onChange={(e) => setCmdTitle(e.target.value)}
                      placeholder="Workflow Title"
                      className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex gap-2 font-mono">
                    <select
                      value={cmdActionType}
                      onChange={(e) => setCmdActionType(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="OPEN_TAB">Open Web URL</option>
                      <option value="RESEARCH_TOPIC">Research Query</option>
                      <option value="VOICE_SPEAK">Spoken Announcement</option>
                    </select>
                    <input
                      type="text"
                      value={cmdActionVal}
                      onChange={(e) => setCmdActionVal(e.target.value)}
                      placeholder={
                        cmdActionType === 'OPEN_TAB'
                          ? 'https://example.com'
                          : cmdActionType === 'RESEARCH_TOPIC'
                          ? 'Topic to search'
                          : 'Message to speak'
                      }
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!cmdTrigger.trim() || !cmdTitle.trim() || !cmdActionVal.trim()}
                      className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </form>

                {/* Commands list */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {customCommands.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-cyan-300">{cmd.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            TRIGGER: "{cmd.trigger}"
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans">{cmd.description}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span>ACTIONS: {cmd.actions.length} step(s)</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCommand(cmd.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete command"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REMINDERS TAB */}
            {activeTab === 'reminders' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase">
                    ACTIVE TIMERS & ALARMS ({reminders.length})
                  </h3>
                  <p className="text-slate-400">
                    Scheduled task alerts with spoken voice reminders and acoustic chimes.
                  </p>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {reminders.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-mono">
                      No active reminders scheduled.
                    </div>
                  ) : (
                    reminders.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-medium text-slate-200">{r.title}</p>
                          <span className="text-[10px] font-mono text-cyan-400">
                            DUE: {new Date(r.dueTime).toLocaleTimeString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteReminder(r.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PRIVACY & DATA TAB */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-mono text-cyan-400 uppercase">
                    PRIVACY & DATA CONTROLS
                  </h3>
                  <p className="text-slate-400">
                    Transparent management of your stored biometric preferences, telemetry, and memories.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                    <span className="font-mono text-slate-300 font-semibold">Client-Side Camera Policy:</span>
                    <p className="text-[11px] text-slate-400">
                      Camera frames processed for gesture tracking are evaluated 100% locally on your device in real-time memory. No frames or video streams are ever uploaded or stored.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                    <span className="font-mono text-slate-300 font-semibold">Gemini Intelligence Security:</span>
                    <p className="text-[11px] text-slate-400">
                      All Gemini API requests are proxied via server-side endpoints with zero client key exposure and authenticated telemetry.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-rose-400 font-semibold">Purge All Assistant Memory</span>
                      <p className="text-[11px] text-slate-500">
                        Permanently wipes all learned facts, reminders, and cached research from local storage.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-mono transition-colors cursor-pointer"
                    >
                      Wipe Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
