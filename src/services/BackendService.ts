
/**
 * Main Backend Service - Local Implementation
 * 
 * This is the single point of contact for all backend operations.
 * Now using LocalAdapter exclusively after removing Supabase dependency.
 */

import { 
  BackendAdapter,
  AuthUser,
  DatabaseRecord 
} from './adapters/types';

import LocalAdapter from './adapters/LocalAdapter';

export class BackendService {
  private adapter: BackendAdapter;

  constructor() {
    // Using LocalAdapter exclusively - no more Supabase
    this.adapter = new LocalAdapter();
  }

  // Auth methods
  async signUp(email: string, password: string, metadata?: any): Promise<AuthUser> {
    return this.adapter.signUp(email, password, metadata);
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    return this.adapter.signIn(email, password);
  }

  async signOut(): Promise<void> {
    return this.adapter.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.adapter.getCurrentUser();
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): (() => void) {
    return this.adapter.onAuthStateChange(callback);
  }

  // Database methods
  async select<T = DatabaseRecord>(table: string, query?: any): Promise<T[]> {
    return this.adapter.select<T>(table, query);
  }

  async insert<T = DatabaseRecord>(table: string, data: any): Promise<T> {
    return this.adapter.insert<T>(table, data);
  }

  async update<T = DatabaseRecord>(table: string, id: string, data: any): Promise<T> {
    return this.adapter.update<T>(table, id, data);
  }

  async delete(table: string, id: string): Promise<void> {
    return this.adapter.delete(table, id);
  }

  subscribe(table: string, callback: (payload: any) => void): (() => void) {
    return this.adapter.subscribe(table, callback);
  }

  // Voice service methods
  createVoiceWebSocketUrl(path: string, params?: Record<string, string>): string {
    return this.adapter.createVoiceWebSocketUrl(path, params);
  }

  processAudioData(audioData: Float32Array): string {
    return this.adapter.processAudioData(audioData);
  }

  handleVoiceMessage(message: any): void {
    return this.adapter.handleVoiceMessage(message);
  }

  // Utility methods
  getCurrentBackendType(): string {
    return this.adapter.getCurrentBackendType();
  }

  isRailwayBackend(): boolean {
    return this.adapter.isRailwayBackend();
  }

  isSupabaseBackend(): boolean {
    return this.adapter.isSupabaseBackend();
  }

  isLocalBackend(): boolean {
    return this.adapter.isLocalBackend();
  }
}

// Export singleton instance
export const backendService = new BackendService();
export type { AuthUser, DatabaseRecord };
