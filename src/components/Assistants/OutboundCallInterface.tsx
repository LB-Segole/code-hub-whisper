
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Assistant } from '@/types/assistant';
import { backendService } from '@/services/BackendService';
import { Phone, PhoneCall, Loader2 } from 'lucide-react';

interface OutboundCallInterfaceProps {
  assistant: Assistant;
  onClose: () => void;
}

export const OutboundCallInterface: React.FC<OutboundCallInterfaceProps> = ({
  assistant,
  onClose,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('');
  const [callSid, setCallSid] = useState<string>('');

  const handleMakeCall = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setCallStatus('Initiating call...');

    try {
      const user = await backendService.getCurrentUser();
      
      // Create call record using local backend
      const callData = await backendService.insert('calls', {
        phone_number: phoneNumber.trim(),
        assistant_id: assistant.id,
        user_id: user?.id,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      setCallSid(callData.id);
      setCallStatus(`Call initiated successfully! Calling ${phoneNumber}...`);
      
      // Simulate call progress updates
      setTimeout(() => setCallStatus('Ringing...'), 2000);
      setTimeout(() => setCallStatus(`Connected! ${assistant.name} is now speaking.`), 5000);

    } catch (error) {
      console.error('Call error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCallStatus(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as +1 (XXX) XXX-XXXX
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              Make Outbound Call
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Assistant: {assistant.name}</h3>
            <p className="text-sm text-gray-600">{assistant.system_prompt?.substring(0, 100)}...</p>
            <p className="text-sm text-gray-500">Voice: {assistant.voice_id}</p>
            <p className="text-sm text-gray-500">Model: {assistant.model}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="+1 (555) 123-4567"
              disabled={isLoading}
            />
          </div>

          {callStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{callStatus}</p>
              {callSid && (
                <p className="text-xs text-blue-600 mt-1">Call ID: {callSid}</p>
              )}
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Make Call
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Ensure the number includes country code</p>
            <p>• The AI assistant will use {assistant.name}'s personality</p>
            <p>• Powered by local backend: {assistant.model}</p>
            <p>• Call logs will be saved to your dashboard</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
