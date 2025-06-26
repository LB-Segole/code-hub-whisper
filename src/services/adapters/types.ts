
/**
 * Core adapter interfaces for backend abstraction
 * These interfaces define the contract that any backend implementation must follow
 */

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface DatabaseRecord {
  id: string;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  timeout?: number;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: number;
}

// Auth Adapter Interface
export interface AuthAdapter {
  signUp(email: string, password: string, metadata?: any): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}

// Database Adapter Interface
export interface DatabaseAdapter {
  select<T = DatabaseRecord>(table: string, query?: any): Promise<T[]>;
  insert<T = DatabaseRecord>(table: string, data: any): Promise<T>;
  update<T = DatabaseRecord>(table: string, id: string, data: any): Promise<T>;
  delete(table: string, id: string): Promise<void>;
  subscribe(table: string, callback: (payload: any) => void): () => void;
}

// WebSocket Adapter Interface
export interface WebSocketAdapter {
  connect(config: WebSocketConfig): Promise<void>;
  disconnect(): void;
  send(data: any): boolean;
  onMessage(callback: (data: any) => void): void;
  onError(callback: (error: string) => void): void;
  onClose(callback: (code: number, reason: string) => void): void;
  get isConnected(): boolean;
  get readyState(): number;
}

// Voice Service Adapter Interface
export interface VoiceServiceAdapter {
  createVoiceWebSocketUrl(path: string, params?: Record<string, string>): string;
  processAudioData(audioData: Float32Array): string;
  handleVoiceMessage(message: any): void;
  getCurrentBackendType(): string;
  isRailwayBackend(): boolean;
  isSupabaseBackend(): boolean;
  isLocalBackend(): boolean;
}

// Combined Backend Adapter Interface
export interface BackendAdapter extends AuthAdapter, DatabaseAdapter, VoiceServiceAdapter {}
