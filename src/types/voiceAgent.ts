
export interface VoiceAgent {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  voice_model: string;
  voice_settings: {
    speed: number;
    pitch: number;
    volume: number;
    emotion: string;
  };
  tools: any[];
  settings: {
    turn_detection: {
      type: 'server_vad' | 'push_to_talk';
      threshold: number;
      silence_duration_ms: number;
    };
    temperature: number;
    max_tokens: number;
    interruption_handling: boolean;
  };
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Legacy fields for compatibility
  first_message?: string;
  voice_provider?: string;
  voice_id?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface VoiceAgentFormData {
  name: string;
  description?: string;
  system_prompt: string;
  voice_model: string;
  voice_settings: {
    speed: number;
    pitch: number;
    volume: number;
    emotion: string;
  };
  tools?: any[];
  settings: {
    turn_detection: {
      type: 'server_vad' | 'push_to_talk';
      threshold: number;
      silence_duration_ms: number;
    };
    temperature: number;
    max_tokens: number;
    interruption_handling: boolean;
  };
  // Legacy fields for compatibility
  first_message?: string;
  voice_provider: string;
  voice_id: string;
  model: string;
  temperature: number;
  max_tokens: number;
}
