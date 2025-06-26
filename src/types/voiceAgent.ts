
export interface VoiceAgent {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  voice_model: string;
  voice_settings: any;
  tools: any[];
  settings: any;
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
  voice_settings?: any;
  tools?: any[];
  settings?: any;
  // Legacy fields
  first_message?: string;
  voice_provider: string;
  voice_id: string;
  model: string;
  temperature: number;
  max_tokens: number;
}
