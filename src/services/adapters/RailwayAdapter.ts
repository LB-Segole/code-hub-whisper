
/**
 * Railway Implementation Template for Backend Adapters
 * This file shows how to implement the same interfaces for Railway
 * 
 * TO MIGRATE TO RAILWAY:
 * 1. Replace the baseUrl with your Railway deployment URL
 * 2. Implement the actual HTTP/WebSocket calls to your Railway backend
 * 3. Update the BackendService to use RailwayAdapters instead of SupabaseAdapters
 * 4. Test each adapter method to ensure compatibility
 */

import { AuthAdapter, DatabaseAdapter, VoiceServiceAdapter, AuthUser, DatabaseRecord } from './types';

export class RailwayAuthAdapter implements AuthAdapter {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    console.log('🚂 RailwayAuthAdapter: Initialized', { baseUrl });
  }

  async signUp(email: string, password: string, metadata?: any): Promise<AuthUser> {
    console.log('🔐 RailwayAuthAdapter: Signing up user', { email });
    
    const response = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, metadata })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sign up failed: ${error}`);
    }
    
    return response.json();
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    console.log('🔐 RailwayAuthAdapter: Signing in user', { email });
    
    const response = await fetch(`${this.baseUrl}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sign in failed: ${error}`);
    }
    
    return response.json();
  }

  async signOut(): Promise<void> {
    console.log('🔐 RailwayAuthAdapter: Signing out user');
    
    const response = await fetch(`${this.baseUrl}/auth/signout`, { 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sign out failed: ${error}`);
    }
    
    // Clear stored token
    localStorage.removeItem('railway_token');
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    console.log('🔐 RailwayAuthAdapter: Getting current user');
    
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const response = await fetch(`${this.baseUrl}/auth/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }

  onAuthStateChange(_callback: (user: AuthUser | null) => void): () => void {
    console.log('🔐 RailwayAuthAdapter: Setting up auth state listener');
    
    // Railway implementation could use WebSocket or polling
    // For now, return a no-op cleanup function
    // TODO: Implement actual auth state monitoring when Railway backend is ready
    
    return () => {
      console.log('🔐 RailwayAuthAdapter: Cleaning up auth state listener');
    };
  }

  private getToken(): string | null {
    return localStorage.getItem('railway_token');
  }
}

export class RailwayDatabaseAdapter implements DatabaseAdapter {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    console.log('🚂 RailwayDatabaseAdapter: Initialized', { baseUrl });
  }

  async select<T = DatabaseRecord>(table: string, query?: any): Promise<T[]> {
    console.log('🗄️ RailwayDatabaseAdapter: Selecting from table', { table, query });
    
    const params = new URLSearchParams();
    if (query) params.append('query', JSON.stringify(query));
    
    const response = await fetch(`${this.baseUrl}/api/${table}?${params}`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Database select failed: ${error}`);
    }
    
    return response.json();
  }

  async insert<T = DatabaseRecord>(table: string, data: any): Promise<T> {
    console.log('🗄️ RailwayDatabaseAdapter: Inserting into table', { table, data });
    
    const response = await fetch(`${this.baseUrl}/api/${table}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Database insert failed: ${error}`);
    }
    
    return response.json();
  }

  async update<T = DatabaseRecord>(table: string, id: string, data: any): Promise<T> {
    console.log('🗄️ RailwayDatabaseAdapter: Updating table record', { table, id, data });
    
    const response = await fetch(`${this.baseUrl}/api/${table}/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Database update failed: ${error}`);
    }
    
    return response.json();
  }

  async delete(table: string, id: string): Promise<void> {
    console.log('🗄️ RailwayDatabaseAdapter: Deleting from table', { table, id });
    
    const response = await fetch(`${this.baseUrl}/api/${table}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Database delete failed: ${error}`);
    }
  }

  subscribe(_table: string, _callback: (payload: any) => void): () => void {
    console.log('🗄️ RailwayDatabaseAdapter: Setting up realtime subscription', { _table });
    
    // Railway implementation would use WebSocket or SSE
    // TODO: Implement actual realtime subscription when Railway backend is ready
    
    return () => {
      console.log('🗄️ RailwayDatabaseAdapter: Cleaning up subscription', { _table });
    };
  }

  private getToken(): string | null {
    return localStorage.getItem('railway_token');
  }
}

export class RailwayVoiceServiceAdapter implements VoiceServiceAdapter {
  private readonly websocketUrl: string;

  constructor(_baseUrl: string, websocketUrl: string) {
    this.websocketUrl = websocketUrl;
    console.log('🚂 RailwayVoiceServiceAdapter: Initialized', { websocketUrl });
  }

  createVoiceWebSocketUrl(path: string, params?: Record<string, string>): string {
    console.log('🎙️ RailwayVoiceServiceAdapter: Creating WebSocket URL', { path, params });
    
    const url = new URL(`${this.websocketUrl}/${path}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    return url.toString();
  }

  processAudioData(audioData: Float32Array): string {
    console.log('🎙️ RailwayVoiceServiceAdapter: Processing audio data', { length: audioData.length });
    
    // Same audio processing logic as Supabase
    const int16Array = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    const base64Audio = btoa(String.fromCharCode(...uint8Array));
    
    return base64Audio;
  }

  handleVoiceMessage(message: any): void {
    console.log('🎙️ RailwayVoiceServiceAdapter: Handling voice message', { type: message.type });
  }

  getCurrentBackendType(): string {
    return 'railway';
  }

  isRailwayBackend(): boolean {
    return true;
  }

  isSupabaseBackend(): boolean {
    return false;
  }

  isLocalBackend(): boolean {
    return false;
  }
}
