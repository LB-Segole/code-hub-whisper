
/**
 * Supabase Implementation of Backend Adapters
 * This file contains all Supabase-specific logic
 * When migrating to Railway, create a RailwayAdapter with the same interface
 */

import { supabase } from '@/lib/supabase';
import { AuthAdapter, DatabaseAdapter, VoiceServiceAdapter, AuthUser, DatabaseRecord } from './types';

export class SupabaseAuthAdapter implements AuthAdapter {
  async signUp(email: string, password: string, metadata?: any): Promise<AuthUser> {
    console.log('🔐 SupabaseAuthAdapter: Signing up user', { email });
    
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(`Sign up failed: ${error.message}`);
    if (!data.user) throw new Error('User creation failed');
    
    return {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
      metadata: data.user.user_metadata
    };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    console.log('🔐 SupabaseAuthAdapter: Signing in user', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Sign in failed: ${error.message}`);
    if (!data.user) throw new Error('Sign in failed');
    
    return {
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata,
      metadata: data.user.user_metadata
    };
  }

  async signOut(): Promise<void> {
    console.log('🔐 SupabaseAuthAdapter: Signing out user');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Sign out failed: ${error.message}`);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    console.log('🔐 SupabaseAuthAdapter: Getting current user');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      metadata: user.user_metadata
    };
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    console.log('🔐 SupabaseAuthAdapter: Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ? {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata,
        metadata: session.user.user_metadata
      } : null;
      callback(user);
    });
    
    return () => subscription.unsubscribe();
  }
}

export class SupabaseDatabaseAdapter implements DatabaseAdapter {
  async select<T = DatabaseRecord>(table: string, query?: any): Promise<T[]> {
    console.log('🗄️ SupabaseDatabaseAdapter: Selecting from table', { table, query });
    
    let queryBuilder = supabase.from(table).select('*');
    
    if (query?.where) {
      for (const [column, value] of Object.entries(query.where)) {
        queryBuilder = queryBuilder.eq(column, value);
      }
    }
    
    if (query?.orderBy) {
      queryBuilder = queryBuilder.order(query.orderBy.column, { ascending: query.orderBy.ascending ?? true });
    }
    
    if (query?.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }
    
    const { data, error } = await queryBuilder;
    if (error) throw new Error(`Database select failed: ${error.message}`);
    return data as T[];
  }

  async insert<T = DatabaseRecord>(table: string, data: any): Promise<T> {
    console.log('🗄️ SupabaseDatabaseAdapter: Inserting into table', { table, data });
    
    const { data: result, error } = await supabase.from(table).insert(data).select().single();
    if (error) throw new Error(`Database insert failed: ${error.message}`);
    return result as T;
  }

  async update<T = DatabaseRecord>(table: string, id: string, data: any): Promise<T> {
    console.log('🗄️ SupabaseDatabaseAdapter: Updating table record', { table, id, data });
    
    const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select().single();
    if (error) throw new Error(`Database update failed: ${error.message}`);
    return result as T;
  }

  async delete(table: string, id: string): Promise<void> {
    console.log('🗄️ SupabaseDatabaseAdapter: Deleting from table', { table, id });
    
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw new Error(`Database delete failed: ${error.message}`);
  }

  subscribe(table: string, callback: (payload: any) => void): () => void {
    console.log('🗄️ SupabaseDatabaseAdapter: Setting up realtime subscription', { table });
    
    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }
}

export class SupabaseVoiceServiceAdapter implements VoiceServiceAdapter {
  createVoiceWebSocketUrl(functionName: string, params?: Record<string, string>): string {
    console.log('🎙️ SupabaseVoiceServiceAdapter: Creating WebSocket URL', { functionName, params });
    
    // Use the deepgram-voice-websocket endpoint that exists
    const baseUrl = `wss://csixccpoxpnwowbgkoyw.supabase.co/functions/v1/deepgram-voice-websocket`;
    
    if (params) {
      const searchParams = new URLSearchParams(params);
      return `${baseUrl}?${searchParams.toString()}`;
    }
    
    return baseUrl;
  }

  processAudioData(audioData: Float32Array): string {
    console.log('🎙️ SupabaseVoiceServiceAdapter: Processing audio data', { length: audioData.length });
    
    // Convert Float32Array to base64 for transmission
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
    console.log('🎙️ SupabaseVoiceServiceAdapter: Handling voice message', { type: message.type });
  }

  getCurrentBackendType(): string {
    return 'supabase';
  }

  isRailwayBackend(): boolean {
    return false;
  }

  isSupabaseBackend(): boolean {
    return true;
  }

  isLocalBackend(): boolean {
    return false;
  }
}
