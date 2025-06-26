
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, PhoneCall, PhoneOff, Mic, AlertCircle, Activity } from 'lucide-react';
import { backendService } from '@/services/BackendService';
import { showErrorToast, showSuccessToast } from '@/utils/errorHandling';
import { Assistant } from '@/types/assistant';
import VoiceInterface from '@/components/VoiceInterface';
import RealtimeVoiceInterface from '@/components/RealtimeVoiceInterface';

interface CallInterfaceProps {
  assistants: Assistant[];
}

type CallStatus = 'idle' | 'initiating' | 'calling' | 'in-call' | 'ended';

const CallInterface: React.FC<CallInterfaceProps> = ({ assistants }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] = useState('');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const selectedAssistant = assistants.find(a => a.id === selectedAssistantId);

  // Subscribe to call updates when a call is active
  useEffect(() => {
    if (!currentCallId) return;

    console.log('📞 Setting up call monitoring for:', currentCallId);
    
    // Poll for call status updates since we removed Supabase realtime
    const interval = setInterval(async () => {
      try {
        const calls = await backendService.select('calls', {
          where: { id: currentCallId },
          limit: 1
        });
        
        if (calls.length > 0) {
          const call = calls[0];
          const newStatus = call.status;
          
          if (newStatus === 'ringing' || newStatus === 'calling') {
            setCallStatus('calling');
            setStatusMessage('Phone is ringing...');
          } else if (newStatus === 'in-progress') {
            setCallStatus('in-call');
            setStatusMessage('Call connected and in progress');
          } else if (newStatus === 'completed' || newStatus === 'busy' || newStatus === 'no-answer' || newStatus === 'failed') {
            setCallStatus('ended');
            setStatusMessage(`Call ${newStatus}`);
            // Reset after 3 seconds
            setTimeout(() => {
              setCallStatus('idle');
              setCurrentCallId(null);
              setPhoneNumber('');
              setSelectedAssistantId('');
              setStatusMessage('');
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error polling call status:', error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [currentCallId]);

  const handleMakeCall = async () => {
    if (!phoneNumber.trim() || !selectedAssistantId) {
      showErrorToast('Please enter a phone number and select an assistant');
      return;
    }

    try {
      setCallStatus('initiating');
      setStatusMessage('Initiating call...');

      const user = await backendService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create call record
      const newCall = await backendService.insert('calls', {
        phone_number: phoneNumber.trim(),
        assistant_id: selectedAssistantId,
        user_id: user.id,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      setCurrentCallId(newCall.id);
      setCallStatus('calling');
      setStatusMessage('Calling...');
      
      showSuccessToast('Call initiated successfully');
    } catch (error) {
      console.error('Error making call:', error);
      showErrorToast('Failed to initiate call');
      setCallStatus('idle');
      setStatusMessage('');
    }
  };

  const handleEndCall = async () => {
    if (!currentCallId) return;

    try {
      await backendService.update('calls', currentCallId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
      
      setCallStatus('ended');
      setStatusMessage('Call ended');
      
      setTimeout(() => {
        setCallStatus('idle');
        setCurrentCallId(null);
        setPhoneNumber('');
        setSelectedAssistantId('');
        setStatusMessage('');
      }, 2000);
      
      showSuccessToast('Call ended');
    } catch (error) {
      console.error('Error ending call:', error);
      showErrorToast('Failed to end call');
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 10) {
      const country = digits.length === 11 && digits[0] === '1' ? digits[0] : '1';
      const area = digits.slice(-10, -7);
      const first = digits.slice(-7, -4);
      const last = digits.slice(-4);
      return `+${country} (${area}) ${first}-${last}`;
    }
    return value;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Voice Call Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="+1 (555) 123-4567"
                disabled={callStatus !== 'idle'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assistant">Select Assistant</Label>
              <Select 
                value={selectedAssistantId} 
                onValueChange={setSelectedAssistantId}
                disabled={callStatus !== 'idle'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an assistant" />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-800">{statusMessage}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {callStatus === 'idle' && (
              <Button
                onClick={handleMakeCall}
                disabled={!phoneNumber.trim() || !selectedAssistantId}
                className="flex-1"
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                Make Call
              </Button>
            )}
            
            {(callStatus === 'calling' || callStatus === 'in-call') && (
              <Button
                onClick={handleEndCall}
                variant="destructive"
                className="flex-1"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Call
              </Button>
            )}
          </div>

          {selectedAssistant && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Selected Assistant: {selectedAssistant.name}</h4>
              <p className="text-sm text-gray-600">{selectedAssistant.system_prompt?.substring(0, 150)}...</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>Voice: {selectedAssistant.voice_id}</span>
                <span>Model: {selectedAssistant.model}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="voice" className="space-y-4">
        <TabsList>
          <TabsTrigger value="voice">Voice Interface</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Voice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="voice">
          <VoiceInterface />
        </TabsContent>
        
        <TabsContent value="realtime">
          <RealtimeVoiceInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CallInterface;
