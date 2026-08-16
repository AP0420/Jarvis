export type CoreState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'RESEARCHING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'ERROR';

export type WindowType =
  | 'RESEARCH'
  | 'COMPARISON'
  | 'WEBSITE'
  | 'NOTES'
  | 'CODE'
  | 'DOCUMENT'
  | 'REMINDER'
  | 'CHAT'
  | 'SYSTEM_MONITOR';

export type WorkspaceLayout =
  | 'freeform'
  | 'grid'
  | 'side_by_side'
  | 'three_column'
  | 'focus'
  | 'stack';

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
  domain?: string;
}

export interface ResearchContent {
  query: string;
  summary: string;
  keyFindings: string[];
  metrics?: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[];
  sources: GroundingSource[];
  relatedTopics: string[];
  rawAnalysis?: string;
}

export interface ComparisonContent {
  topicA: string;
  topicB: string;
  verdict: string;
  matrix: {
    category: string;
    itemA: string;
    itemB: string;
    advantage: 'A' | 'B' | 'EQUAL';
  }[];
  keyDifferences: string[];
  recommendation: string;
}

export interface WebsiteContent {
  title: string;
  url: string;
  description: string;
  category?: string;
  openedAt?: number;
  autoOpened?: boolean;
}

export interface NoteContent {
  title: string;
  text: string;
  tags: string[];
  updatedAt: number;
}

export interface CodeContent {
  language: string;
  code: string;
  fileName?: string;
  explanation?: string;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WorkspaceWindow {
  id: string;
  title: string;
  type: WindowType;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
  query?: string;
  data:
    | { type: 'RESEARCH'; content: ResearchContent }
    | { type: 'COMPARISON'; content: ComparisonContent }
    | { type: 'WEBSITE'; content: WebsiteContent }
    | { type: 'NOTES'; content: NoteContent }
    | { type: 'CODE'; content: CodeContent }
    | { type: 'REMINDER'; content: { reminderId: string } }
    | { type: 'CHAT'; content: { messages: ChatMessage[] } }
    | { type: 'SYSTEM_MONITOR'; content: Record<string, unknown> };
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  sources?: GroundingSource[];
}

export interface CustomCommand {
  id: string;
  trigger: string;
  title: string;
  description: string;
  actions: CommandAction[];
  isEnabled: boolean;
  createdAt: number;
}

export type CommandAction =
  | { type: 'OPEN_TAB'; url: string; label?: string }
  | { type: 'RESEARCH_TOPIC'; query: string }
  | { type: 'CREATE_NOTE'; title: string; content: string }
  | { type: 'VOICE_SPEAK'; message: string }
  | { type: 'ARRANGE_WORKSPACE'; layout: WorkspaceLayout };

export interface MemoryItem {
  id: string;
  content: string;
  category: 'preference' | 'fact' | 'project' | 'instruction';
  timestamp: number;
}

export interface ReminderItem {
  id: string;
  title: string;
  dueTime: number; // epoch ms
  recurring?: 'daily' | 'weekly' | 'none';
  isCompleted: boolean;
  createdAt: number;
}

export interface FaceBiometricDescriptor {
  faceRatio: number; // width / height
  eyeSpanRatio: number; // inter-pupillary distance relative to face width
  chinNoseRatio: number; // nose-to-chin distance relative to face height
  upperFaceIndex?: number; // eye-to-nose vertical distance relative to height
  middleFaceIndex?: number; // nose-to-mouth vertical distance relative to height
  jawlineRatio?: number; // mouth-to-chin vertical distance relative to height
  skinHueAvg: number; // skin tone color profile
  colorHistogram: number[]; // 16-bin color distribution
}

export interface PeopleProfile {
  id: string;
  name: string;
  nickname?: string;
  relation: string; // e.g. "Self / Boss", "Best Friend", "Sister", "Brother", "Mother", "Colleague"
  description: string; // About them, personality, hobbies, preferences
  photos: string[]; // Base64 image snapshots
  faceDescriptor: FaceBiometricDescriptor;
  multiAngleDescriptors?: FaceBiometricDescriptor[]; // Multi-angle 3D profiles (Front, Left, Right)
  lastSeen?: number;
  greetingCount?: number;
  notes?: string[];
  createdAt: number;
}

export interface FaceLandmarks {
  center: { x: number; y: number };
  boundingBox: { x: number; y: number; width: number; height: number };
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  noseTip: { x: number; y: number };
  mouthCenter: { x: number; y: number };
  chin: { x: number; y: number };
  forehead: { x: number; y: number };
  faceRatio: number;
  confidence: number;
}

export interface FaceDetectionResult {
  detected: boolean;
  matchedPerson: PeopleProfile | null;
  confidence: number;
  landmarks: FaceLandmarks | null;
}

export interface MealNutrientBreakdown {
  mealName: string;
  healthy: boolean;
  protein: string; // e.g. "24g"
  carbs: string; // e.g. "45g"
  fiber: string; // e.g. "8g"
  calories?: string; // e.g. "420 kcal"
  verdict: string; // e.g. "High protein, optimal complex carbs for morning sustained energy."
}

export interface DailyHabits {
  date: string; // YYYY-MM-DD
  breakfastAsked: boolean;
  breakfastMeal?: string;
  breakfastNutrients?: MealNutrientBreakdown;
  lunchAsked: boolean;
  lunchMeal?: string;
  lunchNutrients?: MealNutrientBreakdown;
  dinnerAsked: boolean;
  dinnerMeal?: string;
  dinnerNutrients?: MealNutrientBreakdown;
  lastSpokenTimestamp: number;
}

export interface UserProfile {
  userName: string;
  userNickname: string; // e.g. "A.P."
  userPronunciation: string;
  assistantName: string;
  voiceGender: 'male' | 'female';
  assistantVoice: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Samantha' | 'Victoria' | 'Daniel';
  speechRate: number; // 0.8 to 1.3
  speechPitch: number; // 0.8 to 1.2
  wakeWord: string;
  wakeWordEnabled: boolean;
  soundEffectsEnabled: boolean;
  personality: 'Tactical' | 'Intelligent' | 'Witty' | 'Formal';
  dailyGreetingEnabled: boolean;
  lastGreetingDate?: string;
  gestureSensitivity: number; // 1 to 10
  faceRecognitionEnabled?: boolean;
  timezone?: string;
  location?: string;
}

export type HandGesture =
  | 'NONE'
  | 'OPEN_PALM'
  | 'FIST'
  | 'PINCH'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'WAVE'
  | 'SPREAD';

export interface GestureRecognitionResult {
  gesture: HandGesture;
  confidence: number;
  rawHandCoordinates?: { x: number; y: number };
}

export interface IntentResponse {
  intent:
    | 'RESEARCH'
    | 'OPEN_URL'
    | 'EXECUTE_COMMAND'
    | 'CREATE_COMMAND'
    | 'DELETE_COMMAND'
    | 'CREATE_REMINDER'
    | 'LIST_REMINDERS'
    | 'MEMORY_SAVE'
    | 'LIST_MEMORIES'
    | 'MEMORY_FORGET'
    | 'CREATE_WINDOW'
    | 'CLOSE_WINDOW'
    | 'MINIMIZE_WINDOW'
    | 'MAXIMIZE_WINDOW'
    | 'MOVE_WINDOW'
    | 'RESIZE_WINDOW'
    | 'FOCUS_WINDOW'
    | 'ARRANGE_WINDOWS'
    | 'COMPARE_RESEARCH'
    | 'CHAT'
    | 'MEAL_LOG'
    | 'PEOPLE_ENROLL'
    | 'HELP'
    | 'UNKNOWN';
  spokenResponse: string;
  habitUpdate?: {
    mealType: 'breakfast' | 'lunch' | 'dinner';
    mealName: string;
    healthy: boolean;
    protein: string;
    carbs: string;
    fiber: string;
    calories?: string;
    verdict: string;
  };
  details?: Record<string, unknown>;
}
