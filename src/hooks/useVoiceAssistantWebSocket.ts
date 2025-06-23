
import { useState, useRef, useCallback, useEffect } from 'react';
import { Assistant } from '@/types/assistant';

interface VoiceAssistantWebSocketProps {
  assistant: Assistant;
  onTranscript: (text: string) => void;
  onAssistantResponse: (text: string) => void;
  onError: (error: string) => void;
}

export const useVoiceAssistantWebSocket = ({
  assistant,
  onTranscript,
  onAssistantResponse,
  onError,
}: VoiceAssistantWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('🎙️ useVoiceAssistantWebSocket initialized for assistant:', assistant.name);

  const connect = useCallback(async () => {
    try {
      console.log('🔄 Attempting to connect to voice assistant...');
      setStatus('Connecting...');
      
      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Clear any existing timeouts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      
      // Build WebSocket URL with assistant ID
      const wsUrl = `wss://csixccpoxpnwowbgkoyw.supabase.co/functions/v1/deepgram-voice-agent?assistantId=${assistant.id}&userId=browser-user`;
      console.log('🌐 Connecting to:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.log('⏰ Connection timeout');
          wsRef.current.close();
          setStatus('Connection timeout');
          onError('Connection timeout. Please try again.');
        }
      }, 10000);

      wsRef.current.onopen = () => {
        console.log('✅ Voice Assistant WebSocket connected successfully');
        
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        setIsConnected(true);
        setStatus('Connected');
        reconnectAttempts.current = 0;
        
        // Send authentication message
        const authMessage = {
          type: 'auth',
          userId: 'browser-user',
          assistantId: assistant.id
        };
        console.log('📤 Sending auth message:', authMessage);
        wsRef.current?.send(JSON.stringify(authMessage));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data.type, data);
          
          switch (data.type) {
            case 'connection_established':
              console.log('🔗 Connection established');
              setStatus('Initializing...');
              break;
              
            case 'assistant_loaded':
              console.log('🤖 Assistant loaded successfully:', data.data?.assistant?.name);
              setStatus('Assistant loaded');
              break;
              
            case 'stt_connected':
              console.log('🎤 Speech recognition ready');
              break;
              
            case 'tts_connected':
              console.log('🔊 Text-to-speech ready');
              break;
              
            case 'ready':
              console.log('✅ System ready for conversation');
              setStatus('Ready to chat');
              break;
              
            case 'conversation_started':
              console.log('🎬 Conversation started');
              setStatus('Listening...');
              break;
              
            case 'transcript':
              if (data.data?.text) {
                console.log('📝 Transcript received:', data.data.text);
                onTranscript(data.data.text);
                setStatus('Processing...');
              }
              break;
              
            case 'ai_response':
              if (data.data?.text) {
                console.log('🤖 AI Response received:', data.data.text);
                onAssistantResponse(data.data.text);
                setStatus('Speaking...');
              }
              break;
              
            case 'audio_response':
              if (data.data?.audio_base64) {
                console.log('🔊 Playing AI audio response');
                playAudioResponse(data.data.audio_base64);
              }
              break;
              
            case 'auth_confirmed':
              console.log('🔐 Authentication confirmed');
              break;
              
            case 'pong':
              console.log('💓 Pong received');
              break;
              
            case 'error':
              console.error('❌ WebSocket error from server:', data.data?.error);
              onError(data.data?.error || 'Server error');
              setStatus('Error');
              break;
              
            default:
              console.log('❓ Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          onError('Failed to parse server message');
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        setIsConnected(false);
        setIsRecording(false);
        
        if (event.code !== 1000) { // Not a normal closure
          setStatus('Disconnected');
          // Attempt to reconnect
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
            setStatus(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            setStatus('Connection failed');
            onError('Connection lost. Please refresh to try again.');
          }
        } else {
          setStatus('Disconnected');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        
        // Clear connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        setStatus('Connection Error');
        onError('WebSocket connection error');
      };

    } catch (error) {
      console.error('❌ Connection error:', error);
      setStatus('Error');
      onError(`Connection failed: ${error}`);
    }
  }, [assistant.id, onTranscript, onAssistantResponse, onError]);

  const disconnect = useCallback(() => {
    console.log('🔄 Disconnecting from voice assistant...');
    
    // Clear all timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('🛑 Stopping audio track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsConnected(false);
    setIsRecording(false);
    setStatus('Disconnected');
    reconnectAttempts.current = 0;
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    if (!isConnected) {
      console.log('⚠️ Cannot start recording - not connected');
      onError('Not connected to voice assistant');
      return;
    }

    try {
      console.log('🎤 Requesting microphone permission...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('✅ Microphone access granted');
      streamRef.current = stream;
      
      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
        
      console.log('🎵 Using mime type:', mimeType);
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      const audioChunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          console.log('📊 Audio chunk received:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        console.log('🛑 Recording stopped, processing audio...');
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: mimeType });
          processAudioBlob(audioBlob);
        }
        setStatus('Ready to chat');
      };
      
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setStatus('Recording...');
      
      console.log('🎤 Recording started successfully');
      
      // Start conversation if this is the first recording
      wsRef.current?.send(JSON.stringify({
        type: 'start_conversation'
      }));
      
    } catch (error) {
      console.error('❌ Recording error:', error);
      setStatus('Microphone error');
      onError(`Microphone access failed: ${error}`);
    }
  }, [isConnected, onError]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping recording...');
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    setStatus('Processing...');
  }, [isRecording]);

  const processAudioBlob = useCallback(async (audioBlob: Blob) => {
    try {
      console.log('🔄 Converting audio blob to base64...');
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (base64Audio && wsRef.current?.readyState === WebSocket.OPEN) {
          console.log('📤 Sending audio data to server...');
          wsRef.current.send(JSON.stringify({
            type: 'audio_data',
            audio: base64Audio
          }));
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('❌ Error processing audio:', error);
      onError('Failed to process audio');
      setStatus('Ready to chat');
    }
  }, [onError]);

  const playAudioResponse = useCallback(async (base64Audio: string) => {
    try {
      console.log('🔊 Playing audio response...');
      
      // Initialize audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Decode base64 audio
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Decode and play audio
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        console.log('✅ Audio playback finished');
        setStatus('Ready to chat');
      };
      
      source.start();
      
      console.log('✅ Audio playback started');
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      setStatus('Ready to chat'); // Still mark as ready even if audio fails
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('📤 Sending text message:', text);
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        text: text
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up voice assistant WebSocket hook');
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isRecording,
    status,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendTextMessage,
  };
};
