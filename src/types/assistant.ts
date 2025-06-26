
export interface Assistant {
  id: string;
  name: string;
  system_prompt: string;
  first_message?: string;
  voice_provider?: string;
  voice_id?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface AssistantFormData {
  name: string;
  system_prompt: string;
  first_message: string;
  voice_provider: string;
  voice_id: string;
  model: string;
  temperature: number;
  max_tokens: number;
}
