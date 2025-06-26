import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { VoiceAgentFormData, VoiceAgent } from '@/types/voiceAgent';

interface VoiceAgentFormProps {
  agent?: VoiceAgent;
  onSubmit: (data: VoiceAgentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DEEPGRAM_VOICES = [
  { id: 'aura-2-asteria-en', name: 'Asteria (Conversational)' },
  { id: 'aura-2-luna-en', name: 'Luna (Expressive)' },
  { id: 'aura-2-stella-en', name: 'Stella (Friendly)' },
  { id: 'aura-2-athena-en', name: 'Athena (Authoritative)' },
  { id: 'aura-2-hera-en', name: 'Hera (Business)' },
  { id: 'aura-2-orion-en', name: 'Orion (Male, Authoritative)' },
  { id: 'aura-2-arcas-en', name: 'Arcas (Male, Conversational)' },
];

export const VoiceAgentForm: React.FC<VoiceAgentFormProps> = ({
  agent,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<VoiceAgentFormData>({
    name: agent?.name || '',
    description: agent?.description || '',
    system_prompt: agent?.system_prompt || 'You are a helpful AI assistant. Be conversational, friendly, and concise in your responses.',
    voice_model: agent?.voice_model || 'aura-2-asteria-en',
    voice_settings: {
      speed: agent?.voice_settings?.speed || 1.0,
      pitch: agent?.voice_settings?.pitch || 1.0,
      volume: agent?.voice_settings?.volume || 1.0,
      emotion: agent?.voice_settings?.emotion || 'neutral',
    },
    tools: agent?.tools || [],
    settings: {
      turn_detection: {
        type: agent?.settings?.turn_detection?.type || 'server_vad',
        threshold: agent?.settings?.turn_detection?.threshold || 0.5,
        silence_duration_ms: agent?.settings?.turn_detection?.silence_duration_ms || 1000,
      },
      temperature: agent?.settings?.temperature || 0.8,
      max_tokens: agent?.settings?.max_tokens || 500,
      interruption_handling: agent?.settings?.interruption_handling || true,
    },
    // Legacy fields for compatibility
    first_message: agent?.first_message || '',
    voice_provider: 'deepgram',
    voice_id: agent?.voice_id || 'aura-2-asteria-en',
    model: agent?.model || 'nova-2',
    temperature: agent?.temperature || 0.8,
    max_tokens: agent?.max_tokens || 500,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {agent ? 'Edit Voice Agent' : 'Create New Voice Agent'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer Service Agent"
                required
              />
            </div>
            <div>
              <Label htmlFor="voice_model">Voice Model</Label>
              <Select 
                value={formData.voice_model} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, voice_model: value, voice_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEEPGRAM_VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this agent's purpose"
            />
          </div>

          <div>
            <Label htmlFor="system_prompt">System Prompt *</Label>
            <Textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
              placeholder="You are a helpful AI assistant..."
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Voice Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Voice Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Speed: {formData.voice_settings.speed}x</Label>
                <Slider
                  value={[formData.voice_settings.speed]}
                  onValueChange={([value]) => 
                    setFormData(prev => ({
                      ...prev,
                      voice_settings: { ...prev.voice_settings, speed: value }
                    }))
                  }
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Pitch: {formData.voice_settings.pitch}x</Label>
                <Slider
                  value={[formData.voice_settings.pitch]}
                  onValueChange={([value]) => 
                    setFormData(prev => ({
                      ...prev,
                      voice_settings: { ...prev.voice_settings, pitch: value }
                    }))
                  }
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Volume: {formData.voice_settings.volume}x</Label>
                <Slider
                  value={[formData.voice_settings.volume]}
                  onValueChange={([value]) => 
                    setFormData(prev => ({
                      ...prev,
                      voice_settings: { ...prev.voice_settings, volume: value }
                    }))
                  }
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">AI Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Temperature: {formData.settings.temperature}</Label>
                <Slider
                  value={[formData.settings.temperature]}
                  onValueChange={([value]) => 
                    setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, temperature: value },
                      temperature: value
                    }))
                  }
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={formData.settings.max_tokens}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 500;
                    setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, max_tokens: value },
                      max_tokens: value
                    }));
                  }}
                  min={50}
                  max={2000}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="interruption_handling"
                checked={formData.settings.interruption_handling}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, interruption_handling: checked }
                  }))
                }
              />
              <Label htmlFor="interruption_handling">Enable Interruption Handling</Label>
            </div>
          </div>

          {/* Turn Detection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Turn Detection</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Detection Type</Label>
                <Select 
                  value={formData.settings.turn_detection.type} 
                  onValueChange={(value: 'server_vad' | 'push_to_talk') => 
                    setFormData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        turn_detection: { ...prev.settings.turn_detection, type: value }
                      }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="server_vad">Server VAD</SelectItem>
                    <SelectItem value="push_to_talk">Push to Talk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Silence Duration: {formData.settings.turn_detection.silence_duration_ms}ms</Label>
                <Slider
                  value={[formData.settings.turn_detection.silence_duration_ms]}
                  onValueChange={([value]) => 
                    setFormData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        turn_detection: { ...prev.settings.turn_detection, silence_duration_ms: value }
                      }
                    }))
                  }
                  min={500}
                  max={3000}
                  step={100}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
