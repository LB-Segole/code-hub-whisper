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
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const isManualDisconnect = useRef(false);
  const connectionEstablished = useRef(false);
  const lastPongTime = useRef(Date.now());

  console.log('🎙️ useVoiceAssistantWebSocket initialized for assistant:', assistant.name);

  // Start ping-pong keepalive
  const startPingPong = useCallback(() => {
    if (pingIntervalRef.current) return;
    
    console.log('💓 Starting frontend ping-pong system');
    
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          const now = Date.now();
          
          // Check if we haven't received a pong in too long
          if (now - lastPongTime.current > 45000) {
            console.log('⚠️ No pong received for 45s, connection may be dead');
            if (wsRef.current) {
              wsRef.current.close(1008, 'Keepalive timeout');
            }
            return;
          }

          // Send ping
          wsRef.current.send(JSON.stringify({
            type: 'ping',
            timestamp: now
          }));
          console.log('💓 Sent ping to backend');
          
        } catch (error) {
          console.error('❌ Error sending ping:', error);
        }
      } else {
        console.log('💔 WebSocket not open, stopping ping');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      }
    }, 20000); // Ping every 20 seconds
  }, []);

  // Stop ping-pong
  const stopPingPong = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
      console.log('💓 Frontend ping-pong stopped');
    }
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('⚠️ Already connecting, skipping...');
      return;
    }

    try {
      isManualDisconnect.current = false;
      connectionEstablished.current = false;
      
      console.log('🔄 Starting WebSocket connection...');
      setStatus('Connecting...');
      
      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Clear timeouts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      const wsUrl = `wss://csixccpoxpnwowbgkoyw.supabase.co/functions/v1/deepgram-voice-agent`;
      console.log('🌐 Connecting to:', wsUrl);
      
      // Create WebSocket connection
      wsRef.current = new WebSocket(wsUrl);

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Connection timeout after 15 seconds');
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
          setStatus('Connection Timeout');
          onError('Connection timeout - please try again');
        }
      }, 15000);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connection opened successfully!');
        
        // Clear timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        setIsConnected(true);
        setStatus('Connected');
        reconnectAttempts.current = 0;
        connectionEstablished.current = true;
        lastPongTime.current = Date.now();
        
        // Send start message to initialize the session
        const startMessage = {
          event: 'start',
          message: 'Initializing voice assistant session',
          assistantId: assistant.id,
          userId: 'browser-user',
          timestamp: Date.now()
        };
        console.log('📤 Sending start message:', startMessage);
        wsRef.current?.send(JSON.stringify(startMessage));

        // Start ping-pong after connection is established
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            startPingPong();
          }
        }, 1000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          lastPongTime.current = Date.now(); // Update activity time
          
          const data = JSON.parse(event.data);
          console.log('📨 Received message:', data.type || data.event);
          
          switch (data.type || data.event) {
            case 'connection_ready':
              console.log('🔗 Backend connection ready');
              setStatus('Ready');
              break;
              
            case 'ack':
              console.log('✅ Backend acknowledged start:', data.message);
              setStatus('Initializing...');
              break;

            case 'connection_established':
              console.log('🔗 Backend connection established');
              setStatus('Backend Connected');
              break;
              
            case 'ready':
              console.log('✅ Backend ready');
              setStatus('Ready');
              break;
              
            case 'pong':
              console.log('💓 Received pong from backend');
              break;
              
            case 'ping':
              // Respond to backend ping
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: 'pong',
                  timestamp: Date.now()
                }));
                console.log('💓 Sent pong response');
              }
              break;

            case 'transcript':
              if (data.text) {
                console.log('📝 Transcript received:', data.text);
                onTranscript(data.text);
              }
              break;
              
            case 'ai_response':
              if (data.text) {
                console.log('🤖 Assistant response received:', data.text);
                onAssistantResponse(data.text);
              }
              break;
              
            case 'audio_response':
              if (data.audio) {
                console.log('🔊 Audio response received');
                playAudioResponse(data.audio);
              }
              break;

            case 'test_response':
              console.log('🧪 Test response received:', data.message);
              break;
              
            case 'error':
              console.error('❌ Backend error:', data.error);
              onError(data.error || 'Backend error');
              break;
              
            default:
              console.log('❓ Unknown message type:', data.type || data.event);
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed:', { 
          code: event.code, 
          reason: event.reason,
          wasClean: event.wasClean,
          connectionEstablished: connectionEstablished.current
        });
        
        // Clear timeouts and intervals
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        stopPingPong();
        
        setIsConnected(false);
        setIsRecording(false);
        
        if (isManualDisconnect.current) {
          setStatus('Disconnected');
          return;
        }
        
        // Handle reconnection based on close code
        if (event.code === 1006 && !connectionEstablished.current) {
          console.log('❌ Connection failed before establishment (1006)');
          setStatus('Connection Failed');
          onError('Failed to establish WebSocket connection. Please check the Edge Function logs.');
        } else if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          setStatus(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isManualDisconnect.current) {
              connect();
            }
          }, delay);
        } else {
          setStatus('Connection Lost');
          onError('WebSocket connection lost. Please refresh and try again.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error event:', error);
        setStatus('Connection Error');
        onError('WebSocket connection error - please check the Edge Function status');
      };

    } catch (error) {
      console.error('❌ Connection setup error:', error);
      setStatus('Connection Failed');
      onError(`Failed to setup connection: ${error}`);
    }
  }, [assistant.id, onError, onTranscript, onAssistantResponse, startPingPong, stopPingPong]);

  const disconnect = useCallback(() => {
    console.log('🔄 Manual disconnect initiated');
    
    isManualDisconnect.current = true;
    
    // Clear all timeouts and intervals
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    stopPingPong();
    
    // Stop recording and streams
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    }
    
    setIsConnected(false);
    setIsRecording(false);
    setStatus('Disconnected');
    reconnectAttempts.current = 0;
    connectionEstablished.current = false;
  }, [isRecording, stopPingPong]);

  const startRecording = useCallback(async () => {
    console.log('🎤 Start recording requested');
    if (!isConnected) {
      onError('Not connected to voice assistant');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      setIsRecording(true);
      setStatus('Recording...');
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      onError(`Failed to start recording: ${error}`);
    }
  }, [isConnected, onError]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stop recording requested');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setStatus('Ready');
  }, []);

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    console.log('🎵 Processing audio chunk:', audioBlob.size, 'bytes');
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (base64Audio && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            event: 'media',
            media: {
              payload: base64Audio
            },
            timestamp: Date.now()
          }));
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('❌ Error processing audio chunk:', error);
      onError('Failed to process audio');
    }
  }, [onError]);

  const playAudioResponse = useCallback(async (base64Audio: string) => {
    console.log('🔊 Playing audio response');
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        console.log('✅ Audio playback finished');
        setStatus('Ready');
      };
      
      source.start();
      
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      setStatus('Ready');
    }
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('📤 Sending text message:', text);
      wsRef.current.send(JSON.stringify({
        event: 'text_input',
        text: text,
        timestamp: Date.now()
      }));
    } else {
      console.log('⚠️ Cannot send text - WebSocket not connected');
    }
  }, []);

  const sendTestMessage = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🧪 Sending test message');
      wsRef.current.send(JSON.stringify({
        event: 'test',
        message: 'Frontend test message',
        timestamp: Date.now()
      }));
    } else {
      console.log('⚠️ Cannot send test - WebSocket not connected');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up');
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
    sendTestMessage,
    processAudioChunk,
    playAudioResponse,
  };
};
