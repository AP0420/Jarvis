import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  CoreState,
  WindowType,
  WorkspaceLayout,
  WorkspaceWindow,
  UserProfile,
  CustomCommand,
  MemoryItem,
  ReminderItem,
  WindowPosition,
  WindowSize,
  HandGesture,
  PeopleProfile,
  DailyHabits,
} from '../types';
import { soundFx } from '../utils/soundFx';
import { speechEngine } from '../utils/speech';
import { geminiLiveClient } from '../utils/geminiLiveClient';
import { apiService } from '../services/apiService';
import { extensionBridge } from '../services/extensionBridge';

interface SupercomputerContextValue {
  coreState: CoreState;
  statusMessage: string;
  isVoiceActive: boolean;
  transcript: string;
  interimTranscript: string;
  windows: WorkspaceWindow[];
  activeWindowId: string | null;
  layout: WorkspaceLayout;
  userProfile: UserProfile;
  customCommands: CustomCommand[];
  memories: MemoryItem[];
  reminders: ReminderItem[];
  peopleProfiles: PeopleProfile[];
  recognizedPerson: PeopleProfile | null;
  isFaceDetected: boolean;
  dailyHabits: DailyHabits;
  gestureMode: boolean;
  activeGesture: HandGesture;
  activeGestureConfidence: number;
  gestureToast: string | null;
  selectedLanguage: string;
  isCommandCenterOpen: boolean;
  isExtensionModalOpen: boolean;
  isPeopleModalOpen: boolean;
  isGestureCalibrating: boolean;
  audioFrequencyData: Uint8Array;

  // Actions
  setVoiceActive: (active: boolean) => void;
  setSelectedLanguage: (lang: string) => void;
  processUserInput: (input: string) => Promise<void>;
  createResearchWindow: (query: string, forceNew?: boolean) => Promise<WorkspaceWindow | undefined>;
  createComparisonWindow: (topicA: string, topicB: string) => Promise<WorkspaceWindow | undefined>;
  createNewWindow: (
    type: WindowType,
    title: string,
    data: any,
    pos?: WindowPosition,
    size?: WindowSize
  ) => WorkspaceWindow;
  closeWindow: (id: string) => void;
  closeAllResearchWindows: () => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  pinWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, pos: WindowPosition) => void;
  updateWindowSize: (id: string, size: WindowSize) => void;
  setLayout: (layout: WorkspaceLayout) => void;
  openUrl: (url: string, title?: string) => void;
  executeCommand: (command: CustomCommand) => Promise<void>;
  addReminder: (title: string, minutesFromNow?: number, dueTime?: number) => void;
  completeReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  addMemory: (content: string, category?: any) => void;
  deleteMemory: (id: string) => void;
  saveCommand: (cmd: CustomCommand) => void;
  deleteCommand: (id: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addPersonProfile: (profile: PeopleProfile) => void;
  updatePersonProfile: (id: string, updates: Partial<PeopleProfile>) => void;
  deletePersonProfile: (id: string) => void;
  setRecognizedPerson: (person: PeopleProfile | null, confidence?: number) => void;
  setIsFaceDetected: (detected: boolean) => void;
  updateDailyHabits: (habits: Partial<DailyHabits>) => void;
  setGestureMode: (enabled: boolean) => void;
  setActiveGesture: (gesture: HandGesture, confidence: number) => void;
  setCommandCenterOpen: (open: boolean) => void;
  setExtensionModalOpen: (open: boolean) => void;
  setPeopleModalOpen: (open: boolean) => void;
  setGestureCalibrating: (calibrating: boolean) => void;
  speakText: (text: string) => Promise<void>;
  triggerDailyGreeting: () => void;
}

const SupercomputerContext = createContext<SupercomputerContextValue | null>(null);

const DEFAULT_PROFILE: UserProfile = {
  userName: 'Aryan',
  userNickname: 'A.P.',
  userPronunciation: 'AH-ree-yahn',
  assistantName: 'JARVIS',
  voiceGender: 'male',
  assistantVoice: 'Zephyr',
  speechRate: 1.05,
  speechPitch: 1.0,
  wakeWord: 'hey jarvis',
  wakeWordEnabled: true,
  soundEffectsEnabled: true,
  personality: 'Intelligent',
  dailyGreetingEnabled: true,
  gestureSensitivity: 6,
  faceRecognitionEnabled: true,
};

const DEFAULT_PEOPLE: PeopleProfile[] = [
  {
    id: 'person-self',
    name: 'A.P.',
    nickname: 'A.P.',
    relation: 'Self / Boss',
    description: 'System architect and lead developer. Prefers concise briefings and quantum AI insights.',
    photos: [],
    faceDescriptor: {
      faceRatio: 0.84,
      eyeSpanRatio: 0.44,
      chinNoseRatio: 0.41,
      skinHueAvg: 115,
      colorHistogram: new Array(16).fill(0.0625),
    },
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'person-sarah',
    name: 'Sarah',
    nickname: 'Sarah',
    relation: 'Best Friend / Colleague',
    description: 'AI robotics researcher, loves espresso, works on autonomous drone navigation.',
    photos: [],
    faceDescriptor: {
      faceRatio: 0.81,
      eyeSpanRatio: 0.45,
      chinNoseRatio: 0.39,
      skinHueAvg: 125,
      colorHistogram: new Array(16).fill(0.0625),
    },
    createdAt: Date.now() - 86400000 * 2,
  },
];

const getTodayDateStr = () => new Date().toISOString().split('T')[0];

const DEFAULT_HABITS: DailyHabits = {
  date: getTodayDateStr(),
  breakfastAsked: false,
  lunchAsked: false,
  dinnerAsked: false,
  lastSpokenTimestamp: Date.now() - 7200000,
};

const DEFAULT_COMMANDS: CustomCommand[] = [
  {
    id: 'cmd-assemble',
    trigger: 'assemble',
    title: 'Assemble Protocol',
    description: 'Deploys AI agent intelligence suite and research workspace',
    actions: [
      { type: 'VOICE_SPEAK', message: 'Assemble protocol initiated. Deploying research grids.' },
      { type: 'RESEARCH_TOPIC', query: 'Latest AI Agent Frameworks and Autonomous Systems' },
      { type: 'ARRANGE_WORKSPACE', layout: 'side_by_side' },
    ],
    isEnabled: true,
    createdAt: Date.now(),
  },
  {
    id: 'cmd-dev-setup',
    trigger: 'dev setup',
    title: 'Developer Workspace',
    description: 'Launches GitHub, Stack Overflow, and developer research',
    actions: [
      { type: 'OPEN_TAB', url: 'https://github.com', label: 'GitHub' },
      { type: 'OPEN_TAB', url: 'https://news.ycombinator.com', label: 'Hacker News' },
      { type: 'RESEARCH_TOPIC', query: 'State of WebAssembly and High Performance TypeScript' },
    ],
    isEnabled: true,
    createdAt: Date.now(),
  },
  {
    id: 'cmd-market-radar',
    trigger: 'market radar',
    title: 'Market Intelligence Radar',
    description: 'Researches global AI market developments and semiconductor trends',
    actions: [
      { type: 'RESEARCH_TOPIC', query: 'NVIDIA and Semiconductor AI Hardware Market 2026' },
      { type: 'RESEARCH_TOPIC', query: 'Global Enterprise AI Adoption Statistics' },
      { type: 'ARRANGE_WORKSPACE', layout: 'grid' },
    ],
    isEnabled: true,
    createdAt: Date.now(),
  },
];

export const SupercomputerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coreState, setCoreState] = useState<CoreState>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('READY');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  const [windows, setWindows] = useState<WorkspaceWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [layout, setLayoutState] = useState<WorkspaceLayout>('freeform');
  const [maxZIndex, setMaxZIndex] = useState<number>(10);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('jarvis_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [customCommands, setCustomCommands] = useState<CustomCommand[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_commands');
      return saved ? JSON.parse(saved) : DEFAULT_COMMANDS;
    } catch {
      return DEFAULT_COMMANDS;
    }
  });

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_memories');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'mem-1',
              content: 'User prefers concise executive summaries and dark mode UI.',
              category: 'preference',
              timestamp: Date.now() - 3600000,
            },
          ];
    } catch {
      return [];
    }
  });

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [peopleProfiles, setPeopleProfiles] = useState<PeopleProfile[]>(() => {
    try {
      const saved = localStorage.getItem('jarvis_people');
      return saved ? JSON.parse(saved) : DEFAULT_PEOPLE;
    } catch {
      return DEFAULT_PEOPLE;
    }
  });

  const [recognizedPerson, setRecognizedPersonState] = useState<PeopleProfile | null>(null);

  const [dailyHabits, setDailyHabits] = useState<DailyHabits>(() => {
    try {
      const today = getTodayDateStr();
      const saved = localStorage.getItem('jarvis_daily_habits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) {
          return parsed;
        }
      }
      return { ...DEFAULT_HABITS, date: today };
    } catch {
      return DEFAULT_HABITS;
    }
  });

  const [gestureMode, setGestureModeState] = useState<boolean>(false);
  const [activeGesture, setActiveGesture] = useState<HandGesture>('NONE');
  const [activeGestureConfidence, setActiveGestureConfidence] = useState<number>(0);
  const [gestureToast, setGestureToast] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [isCommandCenterOpen, setCommandCenterOpen] = useState<boolean>(false);
  const [isExtensionModalOpen, setExtensionModalOpen] = useState<boolean>(false);
  const [isPeopleModalOpen, setPeopleModalOpen] = useState<boolean>(false);
  const [isGestureCalibrating, setGestureCalibrating] = useState<boolean>(false);
  const [audioFrequencyData, setAudioFrequencyData] = useState<Uint8Array>(new Uint8Array(32));

  const lastGestureActionTimeRef = useRef<number>(0);
  const gestureToastTimeoutRef = useRef<any>(null);
  const lastPersonGreetingTimeRef = useRef<Record<string, number>>({});

  // Audio frequency polling animation frame
  const animFrameRef = useRef<number | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('jarvis_profile', JSON.stringify(userProfile));
    soundFx.setEnabled(userProfile.soundEffectsEnabled);
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('jarvis_commands', JSON.stringify(customCommands));
  }, [customCommands]);

  useEffect(() => {
    localStorage.setItem('jarvis_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('jarvis_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('jarvis_people', JSON.stringify(peopleProfiles));
  }, [peopleProfiles]);

  useEffect(() => {
    localStorage.setItem('jarvis_daily_habits', JSON.stringify(dailyHabits));
  }, [dailyHabits]);

  // Audio visualizer loop
  useEffect(() => {
    const updateAudio = () => {
      if (isVoiceActive || coreState === 'SPEAKING' || coreState === 'LISTENING') {
        const liveData = geminiLiveClient.getIsConnected()
          ? geminiLiveClient.getAudioFrequencyData()
          : speechEngine.getAudioFrequencyData();
        setAudioFrequencyData(new Uint8Array(liveData));
      }
      animFrameRef.current = requestAnimationFrame(updateAudio);
    };
    animFrameRef.current = requestAnimationFrame(updateAudio);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isVoiceActive, coreState]);

  // Reminders scheduler check (runs every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      reminders.forEach((r) => {
        if (!r.isCompleted && r.dueTime <= now && now - r.dueTime < 60000) {
          // Trigger reminder alert!
          soundFx.playReminderAlert();
          speakText(`${userProfile.userName}, you have a reminder: ${r.title}`);
          createNewWindow('REMINDER', `Reminder: ${r.title}`, { reminderId: r.id });
          // Mark completed
          setReminders((prev) =>
            prev.map((item) => (item.id === r.id ? { ...item, isCompleted: true } : item))
          );
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [reminders, userProfile.userName]);

  // Initial Sample Setup on boot if empty
  useEffect(() => {
    if (windows.length === 0) {
      // Boot sample windows
      const win1: WorkspaceWindow = {
        id: 'win-init-research',
        title: 'AI Agents & Autonomous Systems',
        type: 'RESEARCH',
        position: { x: 40, y: 70 },
        size: { width: 560, height: 480 },
        zIndex: 11,
        isMinimized: false,
        isMaximized: false,
        isPinned: false,
        query: 'Latest AI Agent Frameworks',
        data: {
          type: 'RESEARCH',
          content: {
            query: 'Latest AI Agent Frameworks and Autonomous Systems',
            summary:
              'Autonomous AI agents have transitioned from single-prompt models into persistent multi-agent orchestration architectures. Frameworks like LangGraph, AutoGen, and Gemini Live APIs enable continuous decision loops with tool calling, memory banks, and web grounding.',
            keyFindings: [
              'Tool-calling latency dropped by 64% with Gemini 3 Flash series models.',
              'Search-grounded agents show a 91% reduction in factual hallucination rates.',
              'Multi-agent debate models outperform single models in complex reasoning benchmarks.',
            ],
            metrics: [
              { label: 'Grounding Sources', value: '4 Verified', trend: 'up' },
              { label: 'Reasoning Latency', value: '240ms', trend: 'down' },
              { label: 'Intelligence Tier', value: 'Gemini 3.7', trend: 'up' },
            ],
            sources: [
              {
                title: 'Google DeepMind: Gemini Agent Capabilities',
                url: 'https://deepmind.google/technologies/gemini/',
                domain: 'deepmind.google',
              },
              {
                title: 'State of AI Agents: Architecture & Workflows',
                url: 'https://arxiv.org',
                domain: 'arxiv.org',
              },
            ],
            relatedTopics: [
              'Gemini Live API Voice Interaction',
              'Multi-window autonomous research workflows',
              'Computer vision hand tracking in web applications',
            ],
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setWindows([win1]);
      setActiveWindowId(win1.id);
    }
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      setCoreState('SPEAKING');
      setStatusMessage('RESPONDING');

      speechEngine.speak(text, {
        voiceName: userProfile.assistantVoice,
        voiceGender: userProfile.voiceGender || 'male',
        lang: selectedLanguage,
        rate: userProfile.speechRate,
        pitch: userProfile.speechPitch,
        onEnd: () => {
          setCoreState('IDLE');
          setStatusMessage('READY');
        },
      });
    },
    [userProfile, selectedLanguage]
  );

  const triggerDailyGreeting = useCallback(() => {
    const hours = new Date().getHours();
    const userName = recognizedPerson ? (recognizedPerson.nickname || recognizedPerson.name) : (userProfile.userNickname || userProfile.userName || 'A.P.');
    let msg = '';

    if (hours >= 5 && hours < 12) {
      if (!dailyHabits.breakfastAsked) {
        msg = `Good morning ${userName}! Did you have your breakfast yet?`;
      } else {
        msg = `Good morning ${userName}! What would you like to focus on this morning?`;
      }
    } else if (hours >= 12 && hours < 17) {
      if (!dailyHabits.lunchAsked) {
        msg = `Good afternoon ${userName}! Have you had your lunch yet?`;
      } else {
        msg = `Good afternoon ${userName}! All systems ready for your tasks.`;
      }
    } else if (hours >= 17 && hours < 22) {
      if (!dailyHabits.dinnerAsked) {
        msg = `Good evening ${userName}! Did you get a chance to have dinner yet?`;
      } else {
        msg = `Good evening ${userName}! How was your day?`;
      }
    } else {
      msg = `Working late tonight ${userName}? Don't forget to stay hydrated and take periodic breaks.`;
    }

    soundFx.playWakeChirp();
    speakText(msg);
  }, [userProfile, dailyHabits, recognizedPerson, speakText]);

  // Window Management Functions
  const createNewWindow = useCallback(
    (
      type: WindowType,
      title: string,
      data: any,
      pos?: WindowPosition,
      size?: WindowSize
    ): WorkspaceWindow => {
      const nextZ = maxZIndex + 1;
      setMaxZIndex(nextZ);
      soundFx.playWindowSnap();

      // Cascade position
      const offset = (windows.length % 5) * 35;
      const defaultPos: WindowPosition = pos || {
        x: Math.max(20, Math.min(window.innerWidth - 620, 50 + offset)),
        y: Math.max(50, Math.min(window.innerHeight - 520, 60 + offset)),
      };

      const defaultSize: WindowSize = size || {
        width: Math.min(window.innerWidth - 80, 580),
        height: Math.min(window.innerHeight - 120, 500),
      };

      const newWin: WorkspaceWindow = {
        id: `win-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        type,
        position: defaultPos,
        size: defaultSize,
        zIndex: nextZ,
        isMinimized: false,
        isMaximized: false,
        isPinned: false,
        query: data.query || title,
        data: { type, content: data } as any,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setWindows((prev) => [...prev, newWin]);
      setActiveWindowId(newWin.id);
      return newWin;
    },
    [maxZIndex, windows.length]
  );

  const focusWindow = useCallback(
    (id: string) => {
      const nextZ = maxZIndex + 1;
      setMaxZIndex(nextZ);
      setActiveWindowId(id);
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w))
      );
    },
    [maxZIndex]
  );

  const closeWindow = useCallback((id: string) => {
    soundFx.playBlip();
    setWindows((prev) => {
      const next = prev.filter((w) => w.id !== id);
      return next;
    });
    setActiveWindowId((current) => (current === id ? null : current));
  }, []);

  const closeAllResearchWindows = useCallback(() => {
    soundFx.playBlip();
    setWindows((prev) => prev.filter((w) => w.type !== 'RESEARCH' && w.type !== 'COMPARISON'));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    soundFx.playBlip();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: !w.isMinimized } : w))
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    soundFx.playWindowSnap();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
  }, []);

  const pinWindow = useCallback((id: string) => {
    soundFx.playBlip();
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isPinned: !w.isPinned } : w)));
  }, []);

  const updateWindowPosition = useCallback((id: string, pos: WindowPosition) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, position: pos } : w)));
  }, []);

  const updateWindowSize = useCallback((id: string, size: WindowSize) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  }, []);

  // Layout arrangement
  const setLayout = useCallback(
    (newLayout: WorkspaceLayout) => {
      setLayoutState(newLayout);
      soundFx.playWindowSnap();

      if (newLayout === 'freeform') return;

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const topOffset = 60;
      const bottomOffset = 100;
      const usableH = screenH - topOffset - bottomOffset;

      setWindows((prev) => {
        const visibleWins = prev.filter((w) => !w.isMinimized);
        if (visibleWins.length === 0) return prev;

        return prev.map((w) => {
          const index = visibleWins.findIndex((vw) => vw.id === w.id);
          if (index === -1) return w;

          let pos: WindowPosition = w.position;
          let size: WindowSize = w.size;

          if (newLayout === 'grid') {
            const count = visibleWins.length;
            const cols = count <= 2 ? count : count <= 4 ? 2 : 3;
            const rows = Math.ceil(count / cols);
            const cellW = (screenW - 60) / cols;
            const cellH = (usableH - 30) / rows;
            const c = index % cols;
            const r = Math.floor(index / cols);

            pos = { x: 30 + c * cellW, y: topOffset + r * cellH };
            size = { width: cellW - 15, height: cellH - 15 };
          } else if (newLayout === 'side_by_side') {
            const halfW = (screenW - 60) / 2;
            pos = { x: index === 0 ? 25 : 35 + halfW, y: topOffset };
            size = { width: halfW - 15, height: usableH };
          } else if (newLayout === 'three_column') {
            const thirdW = (screenW - 70) / 3;
            const c = index % 3;
            pos = { x: 25 + c * thirdW, y: topOffset };
            size = { width: thirdW - 12, height: usableH };
          } else if (newLayout === 'focus') {
            if (w.id === activeWindowId || index === 0) {
              pos = { x: 60, y: topOffset + 10 };
              size = { width: screenW - 120, height: usableH };
            }
          } else if (newLayout === 'stack') {
            pos = { x: 60 + index * 30, y: topOffset + 10 + index * 30 };
            size = { width: Math.min(680, screenW - 160), height: Math.min(540, usableH - 40) };
          }

          return { ...w, position: pos, size, isMaximized: false };
        });
      });
    },
    [activeWindowId]
  );

  // Deep Internet Research
  const createResearchWindow = useCallback(
    async (query: string, forceNew: boolean = false) => {
      setCoreState('RESEARCHING');
      setStatusMessage(`RESEARCHING: ${query.toUpperCase()}`);
      soundFx.playDataStream();

      try {
        const data = await apiService.performResearch(query, userProfile.personality);

        // Check if there is an existing non-pinned research window to update unless forceNew is true
        const existingWin = !forceNew
          ? windows.find((w) => w.type === 'RESEARCH' && !w.isPinned && w.id === activeWindowId)
          : null;

        if (existingWin) {
          setWindows((prev) =>
            prev.map((w) =>
              w.id === existingWin.id
                ? {
                    ...w,
                    title: `Research: ${query}`,
                    query,
                    data: { type: 'RESEARCH', content: data },
                    updatedAt: Date.now(),
                  }
                : w
            )
          );
          focusWindow(existingWin.id);
          setCoreState('IDLE');
          setStatusMessage('READY');
          return existingWin;
        } else {
          const win = createNewWindow('RESEARCH', `AI Research: ${query}`, data);
          setCoreState('IDLE');
          setStatusMessage('READY');
          return win;
        }
      } catch (err) {
        console.error('[Research failed]', err);
        setCoreState('ERROR');
        setStatusMessage('ATTENTION REQUIRED: RESEARCH FAILED');
        soundFx.playErrorAlert();
        speakText(`I encountered an issue researching "${query}". Please verify connection.`);
      }
    },
    [userProfile.personality, windows, activeWindowId, createNewWindow, focusWindow, speakText]
  );

  // Comparative Research
  const createComparisonWindow = useCallback(
    async (topicA: string, topicB: string) => {
      setCoreState('RESEARCHING');
      setStatusMessage(`COMPARING: ${topicA} vs ${topicB}`);
      soundFx.playDataStream();

      try {
        const compData = await apiService.compareTopics(topicA, topicB);
        const win = createNewWindow('COMPARISON', `Comparison: ${topicA} vs ${topicB}`, compData);
        setCoreState('IDLE');
        setStatusMessage('READY');
        return win;
      } catch (err) {
        console.error('[Comparison failed]', err);
        setCoreState('ERROR');
        setStatusMessage('ATTENTION REQUIRED: COMPARISON FAILED');
        soundFx.playErrorAlert();
      }
    },
    [createNewWindow]
  );

  // Browser Navigation & Open URL
  const openUrl = useCallback(
    (url: string, title?: string) => {
      soundFx.playBlip();
      const res = extensionBridge.openUrlInNewTab(url, title);

      // Create a website window card in workspace for quick context and tracking
      createNewWindow(
        'WEBSITE',
        title || url,
        {
          title: title || url,
          url,
          description: `Browser tab opened for ${url}`,
          openedAt: Date.now(),
          autoOpened: res.success,
        },
        undefined,
        { width: 440, height: 320 }
      );
    },
    [createNewWindow]
  );

  // Custom Command Execution
  const executeCommand = useCallback(
    async (cmd: CustomCommand) => {
      setCoreState('EXECUTING');
      setStatusMessage(`EXECUTING: ${cmd.title.toUpperCase()}`);
      soundFx.playWakeChirp();

      for (const action of cmd.actions) {
        if (action.type === 'VOICE_SPEAK') {
          await speakText(action.message);
        } else if (action.type === 'OPEN_TAB') {
          openUrl(action.url, action.label);
        } else if (action.type === 'RESEARCH_TOPIC') {
          await createResearchWindow(action.query, true);
        } else if (action.type === 'ARRANGE_WORKSPACE') {
          setLayout(action.layout);
        } else if (action.type === 'CREATE_NOTE') {
          createNewWindow('NOTES', action.title, {
            title: action.title,
            text: action.content,
            tags: ['command-generated'],
            updatedAt: Date.now(),
          });
        }
      }

      setCoreState('IDLE');
      setStatusMessage('READY');
    },
    [speakText, openUrl, createResearchWindow, setLayout, createNewWindow]
  );

  // Reminders & Memory handlers
  const addReminder = useCallback((title: string, minutesFromNow?: number, dueTime?: number) => {
    const due = dueTime || (minutesFromNow ? Date.now() + minutesFromNow * 60000 : Date.now() + 1800000);
    const newRem: ReminderItem = {
      id: `rem-${Date.now()}`,
      title,
      dueTime: due,
      isCompleted: false,
      createdAt: Date.now(),
    };
    setReminders((prev) => [newRem, ...prev]);
    soundFx.playBlip();
  }, []);

  const completeReminder = useCallback((id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r))
    );
    soundFx.playBlip();
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    soundFx.playBlip();
  }, []);

  const addMemory = useCallback((content: string, category: any = 'fact') => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const newMem: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content: trimmed,
      category,
      timestamp: Date.now(),
    };

    setMemories((prev) => {
      const filtered = prev.filter((m) => m.content.toLowerCase() !== trimmed.toLowerCase());
      const updated = [newMem, ...filtered];
      try {
        localStorage.setItem('jarvis_memories', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    soundFx.playBlip();
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    soundFx.playBlip();
  }, []);

  const saveCommand = useCallback((cmd: CustomCommand) => {
    setCustomCommands((prev) => {
      const idx = prev.findIndex((c) => c.id === cmd.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = cmd;
        return next;
      }
      return [cmd, ...prev];
    });
    soundFx.playBlip();
  }, []);

  const deleteCommand = useCallback((id: string) => {
    setCustomCommands((prev) => prev.filter((c) => c.id !== id));
    soundFx.playBlip();
  }, []);

  const updateProfile = useCallback((profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
    soundFx.playBlip();
  }, []);

  const addPersonProfile = useCallback((profile: PeopleProfile) => {
    setPeopleProfiles((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
    soundFx.playWakeChirp();
  }, []);

  const updatePersonProfile = useCallback((id: string, updates: Partial<PeopleProfile>) => {
    setPeopleProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    soundFx.playBlip();
  }, []);

  const deletePersonProfile = useCallback((id: string) => {
    setPeopleProfiles((prev) => prev.filter((p) => p.id !== id));
    soundFx.playBlip();
  }, []);

  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [faceDetectionConfidence, setFaceDetectionConfidence] = useState<number>(0);

  const setRecognizedPerson = useCallback((person: PeopleProfile | null, confidence: number = 0.9) => {
    setRecognizedPersonState(person);
    setIsFaceDetected(person !== null);
    setFaceDetectionConfidence(confidence);
    if (person) {
      soundFx.playWakeChirp();
    }
  }, []);

  const updateDailyHabits = useCallback((habits: Partial<DailyHabits>) => {
    setDailyHabits((prev) => ({ ...prev, ...habits }));
  }, []);

  // Natural Language & Voice Intent Processor with Time & Nutrition Habit Engine
  const processUserInput = useCallback(
    async (input: string) => {
      if (!input.trim()) return;

      setTranscript(input);
      setCoreState('THINKING');
      setStatusMessage('PROCESSING');
      soundFx.playWakeChirp();

      // Check quick custom command match
      const matchedCmd = customCommands.find(
        (c) => c.isEnabled && input.toLowerCase().includes(c.trigger.toLowerCase())
      );
      if (matchedCmd) {
        await executeCommand(matchedCmd);
        return;
      }

      // Gather active workspace context for Gemini reasoning
      const activeWin = windows.find((w) => w.id === activeWindowId);
      const openWinSummary = windows.map((w) => ({
        id: w.id,
        title: w.title,
        type: w.type,
        query: w.query,
      }));

      // Calculate Time of Day & Time Since Last Spoken with User Timezone
      const now = new Date();
      const hour = now.getHours();
      const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' =
        hour >= 5 && hour < 12
          ? 'morning'
          : hour >= 12 && hour < 17
          ? 'afternoon'
          : hour >= 17 && hour < 22
          ? 'evening'
          : 'night';

      const userTimeZone =
        userProfile.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        'Asia/Kolkata';

      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: userTimeZone,
      });

      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: userTimeZone,
      });

      const currentLocalTime = timeFormatter.format(now);
      const currentLocalDate = dateFormatter.format(now);
      const tzOffsetMinutes = now.getTimezoneOffset();
      const tzSign = tzOffsetMinutes <= 0 ? '+' : '-';
      const tzHours = Math.abs(Math.floor(tzOffsetMinutes / 60)).toString().padStart(2, '0');
      const tzMins = Math.abs(tzOffsetMinutes % 60).toString().padStart(2, '0');
      const timeZoneOffset = `UTC${tzSign}${tzHours}:${tzMins}`;
      const userLocation = userProfile.location || (userTimeZone.includes('Kolkata') || userTimeZone.includes('Calcutta') || userTimeZone.includes('India') ? 'India' : userTimeZone);
      const minutesSinceLastSpoken = Math.round((Date.now() - (dailyHabits.lastSpokenTimestamp || 0)) / 60000);

      // Verify date sync for habits
      const todayStr = getTodayDateStr();
      const effectiveHabits: DailyHabits =
        dailyHabits.date === todayStr
          ? dailyHabits
          : { ...DEFAULT_HABITS, date: todayStr };

      try {
        const intentResult = await apiService.analyzeIntent(input, {
          activeWindow: activeWin,
          openWindows: openWinSummary,
          userProfile,
          recentMemories: memories.map((m) => m.content),
          customCommands: customCommands.map((c) => ({
            trigger: c.trigger,
            title: c.title,
            actions: c.actions,
          })),
          currentLocalTime,
          currentLocalDate,
          timeZone: userTimeZone,
          timeZoneOffset,
          userLocation,
          timeOfDay,
          minutesSinceLastSpoken,
          dailyHabits: effectiveHabits,
          cameraActive: gestureMode,
          faceDetected: isFaceDetected,
          faceDetectionConfidence,
          recognizedPerson,
          peopleProfiles,
        });

        // Always save memory if extracted
        if (intentResult.memoryContent) {
          addMemory(intentResult.memoryContent);
        }

        // Update habits if nutritional/meal check was returned
        if (intentResult.habitUpdate) {
          const hu = intentResult.habitUpdate;
          setDailyHabits((prev) => {
            const updated = {
              ...prev,
              date: todayStr,
              lastSpokenTimestamp: Date.now(),
              ...(hu.mealType === 'breakfast'
                ? { breakfastAsked: true, breakfastMeal: hu.mealName, breakfastNutrients: hu }
                : hu.mealType === 'lunch'
                ? { lunchAsked: true, lunchMeal: hu.mealName, lunchNutrients: hu }
                : { dinnerAsked: true, dinnerMeal: hu.mealName, dinnerNutrients: hu }),
            };
            return updated;
          });
        } else {
          // Track that user spoke to assistant
          setDailyHabits((prev) => ({ ...prev, lastSpokenTimestamp: Date.now() }));
        }

        // Speak back immediate spoken response
        if (intentResult.spokenResponse) {
          speakText(intentResult.spokenResponse);
        }

        // Execute classified intent
        switch (intentResult.intent) {
          case 'MEAL_LOG': {
            // Already handled via habitUpdate above
            setCoreState('IDLE');
            setStatusMessage('READY');
            break;
          }
          case 'RESEARCH': {
            const query = intentResult.query || input;
            const forceNew = !!intentResult.isNewScreenRequested;
            await createResearchWindow(query, forceNew);
            break;
          }
          case 'OPEN_URL': {
            if (intentResult.url) {
              openUrl(intentResult.url, intentResult.previewTitle);
            }
            break;
          }
          case 'COMPARE_RESEARCH': {
            const topicA = intentResult.targetTopic || activeWin?.title || 'Subject A';
            const topicB = intentResult.query || 'Subject B';
            await createComparisonWindow(topicA, topicB);
            break;
          }
          case 'CREATE_REMINDER': {
            if (intentResult.reminderText) {
              addReminder(intentResult.reminderText, intentResult.reminderMinutes || 30);
            }
            break;
          }
          case 'LIST_REMINDERS': {
            createNewWindow('REMINDER', 'Active Reminders', { reminderId: '' });
            break;
          }
          case 'MEMORY_SAVE': {
            if (intentResult.memoryContent) {
              addMemory(intentResult.memoryContent);
            }
            setCoreState('IDLE');
            setStatusMessage('READY');
            break;
          }
          case 'LIST_MEMORIES': {
            setCommandCenterOpen(true);
            setCoreState('IDLE');
            setStatusMessage('READY');
            break;
          }
          case 'CLOSE_WINDOW': {
            if (intentResult.targetWindowId) {
              closeWindow(intentResult.targetWindowId);
            } else if (input.toLowerCase().includes('all')) {
              closeAllResearchWindows();
            } else if (activeWindowId) {
              closeWindow(activeWindowId);
            }
            break;
          }
          case 'MINIMIZE_WINDOW': {
            if (activeWindowId) minimizeWindow(activeWindowId);
            break;
          }
          case 'MAXIMIZE_WINDOW': {
            if (activeWindowId) maximizeWindow(activeWindowId);
            break;
          }
          case 'FOCUS_WINDOW': {
            if (intentResult.targetWindowId) {
              focusWindow(intentResult.targetWindowId);
            }
            break;
          }
          case 'ARRANGE_WINDOWS': {
            if (intentResult.layout) {
              setLayout(intentResult.layout as WorkspaceLayout);
            } else {
              setLayout('grid');
            }
            break;
          }
          case 'CREATE_WINDOW': {
            createNewWindow('NOTES', 'AI Generated Notes', {
              title: 'Notes',
              text: intentResult.spokenResponse || '',
              tags: ['general'],
              updatedAt: Date.now(),
            });
            break;
          }
          default: {
            setCoreState('IDLE');
            setStatusMessage('READY');
            break;
          }
        }
      } catch (err) {
        console.error('[Intent processing failed]', err);
        setCoreState('ERROR');
        setStatusMessage('ATTENTION REQUIRED');
        soundFx.playErrorAlert();
        speakText("I couldn't process that command. Please try again.");
      }
    },
    [
      customCommands,
      windows,
      activeWindowId,
      userProfile,
      memories,
      dailyHabits,
      recognizedPerson,
      peopleProfiles,
      speakText,
      executeCommand,
      createResearchWindow,
      openUrl,
      createComparisonWindow,
      addReminder,
      createNewWindow,
      addMemory,
      closeWindow,
      closeAllResearchWindows,
      minimizeWindow,
      maximizeWindow,
      focusWindow,
      setLayout,
    ]
  );

  // Setup Web Speech engine callbacks
  useEffect(() => {
    speechEngine.setCallbacks(
      (text, isFinal) => {
        if (!isFinal) {
          setInterimTranscript(text);
          return;
        }

        setInterimTranscript('');
        const clean = text.trim();

        // Check wake word variations
        const wakeWordLower = (userProfile.wakeWord || 'hey jarvis').toLowerCase();
        const lowerText = clean.toLowerCase();

        const isWakeWordSpoken =
          lowerText.includes('awake') ||
          lowerText.includes('wake up') ||
          lowerText.includes('are you awake') ||
          lowerText.includes('hello jarvis') ||
          lowerText.includes('hey jarvis') ||
          lowerText.includes('jarvis') ||
          lowerText.includes(wakeWordLower);

        if (isWakeWordSpoken) {
          soundFx.playWakeChirp();

          // Strip any wake word prefixes
          let commandBody = clean
            .replace(/^are you awake\s*[,:?]?\s*/i, '')
            .replace(/^wake up\s*[,:!]?\s*/i, '')
            .replace(/^awake\s*[,:!]?\s*/i, '')
            .replace(new RegExp(`^${wakeWordLower}\\s*[,:]?\\s*`, 'i'), '')
            .replace(/^hey jarvis\s*[,:]?\s*/i, '')
            .replace(/^hello jarvis\s*[,:]?\s*/i, '')
            .replace(/^jarvis\s*[,:]?\s*/i, '')
            .trim();

          if (commandBody.length > 1) {
            processUserInput(commandBody);
          } else {
            // Wake word alone spoken
            const humanAwakeGreetings = [
              `Yes ${userProfile.userName}, I'm awake and ready. How can I help?`,
              `Right here, ${userProfile.userName}. Systems online. What would you like to do?`,
              `I'm listening, ${userProfile.userName}. What shall we research or open today?`,
              `Fully awake and operational, ${userProfile.userName}. At your service.`,
            ];
            const greeting = humanAwakeGreetings[Math.floor(Math.random() * humanAwakeGreetings.length)];
            speakText(greeting);
          }
        } else {
          // Direct speech command without wake word prefix
          processUserInput(clean);
        }
      },
      (listening, error) => {
        setIsVoiceActive(listening);
        if (listening) {
          setCoreState('LISTENING');
          setStatusMessage('LISTENING');
        } else {
          if (coreState === 'LISTENING') {
            setCoreState('IDLE');
            setStatusMessage('READY');
          }
        }
      },
      (speaking) => {
        if (speaking) {
          setCoreState('SPEAKING');
          setStatusMessage('RESPONDING');
        } else {
          setCoreState('IDLE');
          setStatusMessage('READY');
        }
      }
    );
  }, [userProfile, coreState, processUserInput, speakText]);

  const setVoiceActive = useCallback(
    async (active: boolean) => {
      if (active) {
        soundFx.playWakeChirp();
        setIsVoiceActive(true);
        setCoreState('LISTENING');
        setStatusMessage('INITIALIZING GEMINI LIVE...');

        // Configure Gemini Live 3.1 Session Callbacks
        geminiLiveClient.setCallbacks({
          onConnected: ({ model, voice }) => {
            setStatusMessage(`GEMINI LIVE 3.1 (${voice.toUpperCase()})`);
            setCoreState('LISTENING');
          },
          onUserTranscript: (text) => {
            setInterimTranscript(text);
          },
          onAITranscript: (text) => {
            setTranscript(text);
            setStatusMessage('GEMINI LIVE RESPONDING');
          },
          onSpeakingState: (speaking) => {
            if (speaking) {
              setCoreState('SPEAKING');
              setStatusMessage('GEMINI LIVE SPEAKING');
            } else {
              setCoreState('LISTENING');
              setStatusMessage('GEMINI LIVE LISTENING');
            }
          },
          onInterrupted: () => {
            soundFx.playBlip();
            setStatusMessage('INTERRUPTED');
          },
          onToolCall: async (tool) => {
            const { name, args } = tool;
            soundFx.playWakeChirp();

            if (name === 'openWebsite' && args?.url) {
              openUrl(args.url, args.title || 'Web Preview');
            } else if (name === 'performResearch' && args?.query) {
              const query = args.query;
              const newWin = createNewWindow('RESEARCH', query, {
                query,
                summary: `Initiating live Gemini deep search intelligence on "${query}"...`,
                keyFindings: ['Gathering grounded search indexes across verified domains...'],
                metrics: [
                  { label: 'Grounding Verification', value: 'Live Connecting', trend: 'up' },
                  { label: 'Intelligence Core', value: 'Gemini 3.1 Live', trend: 'up' },
                ],
                sources: [
                  {
                    title: `Google Search: ${query}`,
                    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                    domain: 'google.com',
                  },
                ],
                relatedTopics: [`${query} architecture`, `${query} real-time data`],
              });

              apiService.performResearch(query, userProfile.personality).then((researchData) => {
                setWindows((prev) =>
                  prev.map((w) =>
                    w.id === newWin.id
                      ? {
                          ...w,
                          data: { type: 'RESEARCH', content: researchData },
                          updatedAt: Date.now(),
                        }
                      : w
                  )
                );
              });
            } else if (name === 'compareTopics' && args?.topicA && args?.topicB) {
              createComparisonWindow(args.topicA, args.topicB);
            } else if (name === 'arrangeLayout' && args?.layout) {
              setLayout(args.layout as any);
            } else if (name === 'createReminder' && args?.text) {
              addReminder(args.text, args.minutes || 30);
            } else if (name === 'saveMemory' && args?.fact) {
              addMemory(args.fact, 'preference');
            } else if (name === 'closeAllWindows') {
              closeAllResearchWindows();
            }
          },
          onError: async (errorMsg) => {
            console.warn('[Gemini Live Error - Fallback to SpeechEngine]:', errorMsg);
            setStatusMessage('SWITCHING TO LOCAL SPEECH...');
            await speechEngine.startListening();
          },
          onDisconnected: () => {
            if (isVoiceActive) {
              setIsVoiceActive(false);
              setCoreState('IDLE');
              setStatusMessage('READY');
            }
          },
        });

        const connected = await geminiLiveClient.connect({
          voice: userProfile.assistantVoice,
          assistantName: userProfile.assistantName,
          userName: userProfile.userName,
        });

        if (!connected) {
          // Fallback to SpeechEngine if WebSocket fails
          const ok = await speechEngine.startListening();
          if (ok) {
            setIsVoiceActive(true);
            setCoreState('LISTENING');
            setStatusMessage('VOICE LISTENING');
          }
        }
      } else {
        geminiLiveClient.disconnect();
        speechEngine.stopListening();
        setIsVoiceActive(false);
        setCoreState('IDLE');
        setStatusMessage('READY');
      }
    },
    [
      userProfile,
      isVoiceActive,
      openUrl,
      createNewWindow,
      createComparisonWindow,
      setLayout,
      addReminder,
      addMemory,
      closeAllResearchWindows,
    ]
  );

  const setGestureMode = useCallback((enabled: boolean) => {
    setGestureModeState(enabled);
    soundFx.playBlip();
  }, []);

  const setActiveGestureConfidenceHandler = useCallback(
    (gesture: HandGesture, confidence: number) => {
      setActiveGesture(gesture);
      setActiveGestureConfidence(confidence);

      const now = Date.now();
      // Cooldown of 900ms between gesture action triggers
      if (confidence > 0.82 && now - lastGestureActionTimeRef.current > 900) {
        let toastText = '';

        if (gesture === 'SWIPE_LEFT') {
          if (windows.length > 1) {
            const curIdx = windows.findIndex((w) => w.id === activeWindowId);
            const nextIdx = (curIdx + 1) % windows.length;
            focusWindow(windows[nextIdx].id);
            soundFx.playGestureAction('SWIPE_LEFT');
            toastText = `👈 Swiped Left: Focused ${windows[nextIdx].title}`;
          } else if (windows.length === 1) {
            soundFx.playGestureAction('SWIPE_LEFT');
            toastText = '👈 Swiped Left: Active Screen Ready';
          }
        } else if (gesture === 'SWIPE_RIGHT') {
          if (windows.length > 1) {
            const curIdx = windows.findIndex((w) => w.id === activeWindowId);
            const prevIdx = (curIdx - 1 + windows.length) % windows.length;
            focusWindow(windows[prevIdx].id);
            soundFx.playGestureAction('SWIPE_RIGHT');
            toastText = `👉 Swiped Right: Focused ${windows[prevIdx].title}`;
          } else if (windows.length === 1) {
            soundFx.playGestureAction('SWIPE_RIGHT');
            toastText = '👉 Swiped Right: Active Screen Ready';
          }
        } else if (gesture === 'SPREAD') {
          setLayout('grid');
          soundFx.playGestureAction('SPREAD');
          toastText = '👐 Hand Spread: Grid Matrix Layout Engaged';
        } else if (gesture === 'FIST') {
          if (activeWindowId) {
            minimizeWindow(activeWindowId);
            soundFx.playGestureAction('FIST');
            toastText = '✊ Fist Grab: Window Minimized';
          }
        } else if (gesture === 'PINCH') {
          if (activeWindowId) {
            closeWindow(activeWindowId);
            soundFx.playGestureAction('PINCH');
            toastText = '🤏 Pinch: Closed Active Window';
          }
        } else if (gesture === 'OPEN_PALM') {
          if (activeWindowId) {
            focusWindow(activeWindowId);
            soundFx.playGestureAction('OPEN_PALM');
            toastText = '🖐️ Open Palm: Focused Active Window';
          }
        }

        if (toastText) {
          lastGestureActionTimeRef.current = now;
          setGestureToast(toastText);
          clearTimeout(gestureToastTimeoutRef.current);
          gestureToastTimeoutRef.current = setTimeout(() => {
            setGestureToast(null);
          }, 2400);
        }
      }
    },
    [windows, activeWindowId, focusWindow, setLayout, minimizeWindow, closeWindow]
  );

  return (
    <SupercomputerContext.Provider
      value={{
        coreState,
        statusMessage,
        isVoiceActive,
        transcript,
        interimTranscript,
        windows,
        activeWindowId,
        layout,
        userProfile,
        customCommands,
        memories,
        reminders,
        peopleProfiles,
        recognizedPerson,
        isFaceDetected,
        dailyHabits,
        gestureMode,
        activeGesture,
        activeGestureConfidence,
        gestureToast,
        selectedLanguage,
        isCommandCenterOpen,
        isExtensionModalOpen,
        isPeopleModalOpen,
        isGestureCalibrating,
        audioFrequencyData,
        setVoiceActive,
        setSelectedLanguage,
        processUserInput,
        createResearchWindow,
        createComparisonWindow,
        createNewWindow,
        closeWindow,
        closeAllResearchWindows,
        minimizeWindow,
        maximizeWindow,
        pinWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
        setLayout,
        openUrl,
        executeCommand,
        addReminder,
        completeReminder,
        deleteReminder,
        addMemory,
        deleteMemory,
        saveCommand,
        deleteCommand,
        updateProfile,
        addPersonProfile,
        updatePersonProfile,
        deletePersonProfile,
        setRecognizedPerson,
        setIsFaceDetected,
        updateDailyHabits,
        setGestureMode,
        setActiveGesture: setActiveGestureConfidenceHandler,
        setCommandCenterOpen,
        setExtensionModalOpen,
        setPeopleModalOpen,
        setGestureCalibrating,
        speakText,
        triggerDailyGreeting,
      }}
    >
      {children}
    </SupercomputerContext.Provider>
  );
};

export const useSupercomputer = () => {
  const ctx = useContext(SupercomputerContext);
  if (!ctx) {
    throw new Error('useSupercomputer must be used within a SupercomputerProvider');
  }
  return ctx;
};
