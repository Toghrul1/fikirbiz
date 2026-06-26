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
  contentType: CanvaContentType;
  title?: string;
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
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
}

export interface VoiceInputState {
  isRecording: boolean;
  isSupported: boolean;
  isPermissionGranted: boolean;
  interimTranscript: string;
  errorCount: number;
  status: 'idle' | 'requesting_permission' | 'recording' | 'error' | 'unsupported';
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
