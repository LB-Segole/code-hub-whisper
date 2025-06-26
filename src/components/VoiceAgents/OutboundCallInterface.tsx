
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceAgent } from '@/types/voiceAgent';
import { backendService } from '@/services/BackendService';
import { Phone, PhoneCall, Loader2 } from 'lucide-react';

interface OutboundCallInterfaceProps {
  agent: VoiceAgent;
  onClose: () => void;
}

export const OutboundCallInterface: React.FC<OutboundCallInterfaceProps> = ({
  agent,
  onClose,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('');
  const [callId, setCallId] = useState<string>('');

  const handleMakeCall = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setCallStatus('Initiating call...');

    try {
      const user = await backendService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create call record in local database
      const newCall = await backendService.insert('calls', {
        phone_number: phoneNumber,
        status: 'pending',
        user_id: user.id,
        agent_id: agent.id,
        created_at: new Date().toISOString()
      });

      setCallId(newCall.id);
      setCallStatus(`Call initiated with ${agent.name}`);
      
      // Simulate call progression for demo
      setTimeout(() => {
        setCallStatus('Call in progress...');
      }, 2000);

    } catch (error) {
      console.error('Error making call:', error);
      setCallStatus('Failed to initiate call');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (!callId) return;

    try {
      await backendService.update('calls', callId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
      
      setCallStatus('Call ended');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Outbound Call - {agent.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {callStatus && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">{callStatus}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleMakeCall}
            disabled={isLoading || !phoneNumber.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calling...
              </>
            ) : (
              <>
                <PhoneCall className="mr-2 h-4 w-4" />
                Make Call
              </>
            )}
          </Button>
          
          {callId && (
            <Button 
              onClick={handleEndCall}
              variant="outline"
              className="flex-1"
            >
              End Call
            </Button>
          )}
        </div>

        <Button 
          onClick={onClose}
          variant="ghost"
          className="w-full"
        >
          Close
        </Button>
      </CardContent>
    </Card>
  );
};
