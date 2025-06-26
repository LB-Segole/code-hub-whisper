
import { BackendAdapter, AuthUser, DatabaseRecord } from './types';

class LocalAdapter implements BackendAdapter {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.token = localStorage.getItem('local_auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async signUp(email: string, password: string, metadata?: any): Promise<AuthUser> {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: metadata?.name || '' }),
    });

    this.token = data.token;
    localStorage.setItem('local_auth_token', this.token!);

    return {
      id: data.user.id,
      email: data.user.email,
      user_metadata: { name: data.user.name },
    };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const data = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.token = data.token;
    localStorage.setItem('local_auth_token', this.token!);

    return {
      id: data.user.id,
      email: data.user.email,
      user_metadata: { name: data.user.name },
    };
  }

  async signOut(): Promise<void> {
    this.token = null;
    localStorage.removeItem('local_auth_token');
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.token) return null;

    try {
      const data = await this.request('/auth/user');
      return {
        id: data.user.id,
        email: data.user.email,
        user_metadata: { name: data.user.name },
      };
    } catch {
      // Token might be expired
      this.signOut();
      return null;
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): (() => void) {
    // For local implementation, we'll just call the callback once with current user
    this.getCurrentUser().then(callback);
    
    // Return a cleanup function (no-op for local)
    return () => {};
  }

  async select<T = DatabaseRecord>(table: string, query?: any): Promise<T[]> {
    let endpoint = `/${table}`;
    
    if (query) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      endpoint += `?${params.toString()}`;
    }

    const data = await this.request(endpoint);
    return data.data || [];
  }

  async insert<T = DatabaseRecord>(table: string, data: any): Promise<T> {
    const response = await this.request(`/${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async update<T = DatabaseRecord>(table: string, id: string, data: any): Promise<T> {
    const response = await this.request(`/${table}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async delete(table: string, id: string): Promise<void> {
    await this.request(`/${table}/${id}`, {
      method: 'DELETE',
    });
  }

  subscribe(table: string, callback: (payload: any) => void): (() => void) {
    // For local implementation, we'll use polling or WebSocket
    // For now, return a no-op cleanup function
    return () => {};
  }

  createVoiceWebSocketUrl(path: string, params?: Record<string, string>): string {
    const wsUrl = this.baseUrl.replace('http', 'ws');
    const searchParams = new URLSearchParams(params);
    return `${wsUrl}/${path}?${searchParams.toString()}`;
  }

  processAudioData(audioData: Float32Array): string {
    // Convert Float32Array to base64
    const buffer = new ArrayBuffer(audioData.length * 4);
    const view = new Float32Array(buffer);
    view.set(audioData);
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  handleVoiceMessage(message: any): void {
    console.log('Local voice message:', message);
  }

  getCurrentBackendType(): string {
    return 'local';
  }

  isRailwayBackend(): boolean {
    return false;
  }

  isSupabaseBackend(): boolean {
    return false;
  }

  isLocalBackend(): boolean {
    return true;
  }
}

export default LocalAdapter;
