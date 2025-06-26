
/**
 * Main Backend Service - Migration Interface
 * 
 * This is the single point of contact for all backend operations.
 * It uses adapter pattern to abstract different backend implementations.
 * 
 * MIGRATION GUIDE:
 * ================
 * 
 * Current State: Uses LocalAdapter for local development
 * Future State: Can switch to Railway or Supabase as needed
 * 
 * To migrate backends:
 * 1. Update environment variables
 * 2. No changes needed in React components!
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
    // For now, we'll use LocalAdapter as the default
    // In the future, this can be switched based on environment variables
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
