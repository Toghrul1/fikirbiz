// --- Auth Types ---

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'customer';
}

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  registeredAt: string;
  canvaConnectorStatus: 'connected' | 'disconnected' | 'error';
  activeChatSessionCount: number;
}

export interface UserTableRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  registeredAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

// --- Chat / Canva Types ---

export type CanvaContentType =
  | 'DESIGN'
  | 'PRESENTATION'
  | 'SOCIAL_MEDIA'
  | 'POSTER'
  | 'BANNER';

export interface CanvaDesignLink {
  designId: string;
  editUrl: string;
  viewUrl?: string;
  contentType: CanvaContentType;
  title?: string;
  thumbnailUrl?: string;
  createdAt?: number;
}

export interface CanvaDesign {
  id: string;
  title: string;
  editUrl: string;
  viewUrl: string;
  thumbnailUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CanvaDesignListResponse {
  items: CanvaDesign[];
  continuation?: string;
}

export interface CanvaExportJob {
  jobId: string;
  status: 'in_progress' | 'success' | 'failed';
  urls?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  canvaLinks?: CanvaDesignLink[];
  isError?: boolean;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export interface MessageHistory {
  sessionId: string;
  messages: Message[];
}

export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

export interface CanvaConnectorState {
  status: ConnectorStatus;
  lastUpdated: number;
  errorMessage?: string;
  canvaUsername?: string;
}

export interface VoiceInputState {
  isRecording: boolean;
  isSupported: boolean;
  isPermissionGranted: boolean;
  interimTranscript: string;
  errorCount: number;
  status: 'idle' | 'requesting_permission' | 'recording' | 'error' | 'unsupported';
}

// --- Toast Types ---

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// --- Content Generator Types ---

export interface ContentGenerateRequest {
  language: string;
  productServiceTopic: string;
  brandName?: string;
  keyFeatures?: string;
  targetAudience?: string;
  callToAction?: string;
}

export interface InstagramPost {
  caption: string;
  hashtags: string[];
}

export interface InstagramReels {
  script: string;
  caption: string;
  hashtags: string[];
}

export interface GeneratedContent {
  post: InstagramPost;
  reels: InstagramReels;
}

// --- App Store Types ---

export interface AppState {
  sessions: Session[];
  activeSessionId: string | null;
  currentMessages: Message[];
  isLoading: boolean;
  sidebarOpen: boolean;
  connector: CanvaConnectorState;
  voice: VoiceInputState;
  toasts: Toast[];
  designs: CanvaDesign[];
  designsLoading: boolean;
  sendMessage: (prompt: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  createNewSession: () => void;
  deleteSession: (sessionId: string) => void;
  toggleSidebar: () => void;
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  initiateCanvaAuth: () => Promise<void>;
  disconnectCanva: () => Promise<void>;
  checkCanvaStatus: () => Promise<void>;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  loadDesigns: () => Promise<void>;
  exportDesign: (designId: string, format: string) => Promise<CanvaExportJob | null>;
  deleteDesign: (designId: string) => Promise<void>;
}
