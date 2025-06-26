/**
 * Main Backend Service - Migration Interface
 * 
 * This is the single point of contact for all backend operations.
 * It uses adapter pattern to abstract different backend implementations.
 * 
 * MIGRATION GUIDE:
 * ================
 * 
 * Current State: Uses SupabaseAdapters
 * Future State: Switch to RailwayAdapters
 * 
 * To migrate to Railway:
 * 1. Update BACKEND_TYPE to 'railway'
 * 2. Set RAILWAY_BASE_URL to your Railway deployment
 * 3. Implement any missing methods in RailwayAdapters
 * 4. Test each service method thoroughly
 * 5. No changes needed in React components!
 */

import { 
  AuthAdapter,
  DatabaseAdapter, 
  VoiceServiceAdapter,
  AuthUser,
  DatabaseRecord 
} from './adapters/types';

import SupabaseAdapter from './adapters/SupabaseAdapter';
import RailwayAdapter from './adapters/RailwayAdapter';
import LocalAdapter from './adapters/LocalAdapter';

// Migration Configuration
// =====================
// Change these values to switch backends
const BACKEND_TYPE: 'supabase' | 'railway' = 'supabase';
const RAILWAY_BASE_URL = 'https://your-railway-app.railway.app'; // Update when migrating
const RAILWAY_WS_URL = 'wss://your-railway-app.railway.app'; // Update when migrating

export class BackendService {
  private adapter: BackendAdapter;

  constructor() {
    // Determine which backend to use based on environment
    const backendType = this.getBackendType();
    
    switch (backendType) {
      case 'local':
        this.adapter = new LocalAdapter();
        break;
      case 'railway':
        this.adapter = new RailwayAdapter();
        break;
      case 'supabase':
      default:
        this.adapter = new SupabaseAdapter();
        break;
    }
  }

  private getBackendType(): string {
    // Check if we're in local development mode
    if (import.meta.env.VITE_USE_LOCAL_BACKEND === 'true') {
      return 'local';
    }
    
    // Check for Railway environment
    if (import.meta.env.VITE_RAILWAY_BACKEND_URL) {
      return 'railway';
    }
    
    // Default to Supabase
    return 'supabase';
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
export { AuthUser, DatabaseRecord };
