
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceWebSocketProps {
  userId: string;
  callId: string;
  assistantId: string;
  onConnectionChange: (connected: boolean) => void;
  onMessage: (message: any) => void;
  onError: (error: string) => void;
}

export const useVoiceWebSocket = ({
  onConnectionChange,
  onMessage,
  onError
}: UseVoiceWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const connect = useCallback(async () => {
    try {
      setConnectionState('connecting');
      
      // Simulate connection for local mode
      setTimeout(() => {
        setIsConnected(true);
        setConnectionState('connected');
        setIsRecording(true);
        onConnectionChange(true);
        onMessage({
          type: 'connection_established',
          data: { assistant: { name: 'Local Assistant' } }
        });
      }, 1000);
      
    } catch (error) {
      setConnectionState('error');
      onError(error instanceof Error ? error.message : 'Connection failed');
    }
  }, [onConnectionChange, onMessage, onError]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setIsRecording(false);
    setConnectionState('disconnected');
    onConnectionChange(false);
  }, [onConnectionChange]);

  const sendTextMessage = useCallback((message: string) => {
    if (!isConnected) return;
    
    // Simulate response for local mode
    setTimeout(() => {
      onMessage({
        type: 'ai_response',
        data: {
          text: `I received your message: "${message}". This is a local response.`,
          intent: 'general',
          confidence: 0.95
        }
      });
    }, 1000);
  }, [isConnected, onMessage]);

  const requestGreeting = useCallback(() => {
    if (!isConnected) return;
    
    setTimeout(() => {
      onMessage({
        type: 'greeting_sent',
        data: {
          text: 'Hello! I\'m your local voice assistant. How can I help you today?'
        }
      });
    }, 500);
  }, [isConnected, onMessage]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    isConnected,
    isRecording,
    connectionState,
    connect,
    disconnect,
    sendTextMessage,
    requestGreeting
  };
};
