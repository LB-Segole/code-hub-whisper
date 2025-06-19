
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('🚀 DeepGram Voice WebSocket initialized v3.0 - Fixed imports');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, UPGRADE',
}

// Conversation service logic moved directly into the edge function
interface ConversationResponse {
  text: string;
  shouldTransfer: boolean;
  shouldEndCall: boolean;
  intent: string;
  confidence: number;
}

interface ConversationContext {
  callId: string;
  agentPrompt?: string;
  agentPersonality?: string;
  previousMessages?: Array<{ role: string; content: string }>;
}

const generateConversationResponse = async (
  userInput: string,
  context: ConversationContext
): Promise<ConversationResponse> => {
  try {
    const input = userInput.toLowerCase().trim();
    const agentPersonality = context.agentPersonality || 'professional';
    const agentPrompt = context.agentPrompt || 'You are a helpful AI assistant.';
    
    let responsePrefix = '';
    if (agentPersonality === 'friendly') {
      responsePrefix = 'That sounds wonderful! ';
    } else if (agentPersonality === 'professional') {
      responsePrefix = 'I understand. ';
    } else if (agentPersonality === 'casual') {
      responsePrefix = 'Got it! ';
    }
    
    // Greeting responses
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return {
        text: `Hello! Thank you for connecting. ${agentPrompt.includes('business') ? 'I\'m here to help with your business needs.' : 'How can I assist you today?'}`,
        shouldTransfer: false,
        shouldEndCall: false,
        intent: 'greeting',
        confidence: 0.9
      };
    }
    
    // Business inquiry responses
    if (input.includes('business') || input.includes('service') || input.includes('help')) {
      return {
        text: `${responsePrefix}I'd be happy to help you with that. Can you tell me more about what specific assistance you're looking for?`,
        shouldTransfer: false,
        shouldEndCall: false,
        intent: 'business_inquiry',
        confidence: 0.8
      };
    }
    
    // Pricing inquiries
    if (input.includes('price') || input.includes('cost') || input.includes('expensive')) {
      return {
        text: `${responsePrefix}I understand you're interested in pricing information. Let me connect you with someone who can provide detailed pricing based on your specific needs.`,
        shouldTransfer: true,
        shouldEndCall: false,
        intent: 'pricing_inquiry',
        confidence: 0.8
      };
    }
    
    // Transfer requests
    if (input.includes('human') || input.includes('person') || input.includes('representative')) {
      return {
        text: `${responsePrefix}Of course! Let me connect you with one of our human representatives who can provide more detailed assistance.`,
        shouldTransfer: true,
        shouldEndCall: false,
        intent: 'transfer_request',
        confidence: 0.9
      };
    }
    
    // Negative responses
    if (input.includes('not interested') || input.includes('no thank') || input.includes('busy')) {
      return {
        text: `${responsePrefix}I understand you're not interested right now. Thank you for your time, and please feel free to reach out if your needs change. Have a great day!`,
        shouldTransfer: false,
        shouldEndCall: true,
        intent: 'not_interested',
        confidence: 0.8
      };
    }
    
    // Generic response based on agent prompt
    const contextualResponse = agentPrompt.includes('sales') 
      ? `I'd love to learn more about how we can help your business grow. What challenges are you currently facing?`
      : `That's interesting! Can you tell me more about that so I can better assist you?`;
    
    return {
      text: `${responsePrefix}${contextualResponse}`,
      shouldTransfer: false,
      shouldEndCall: false,
      intent: 'general_inquiry',
      confidence: 0.6
    };

  } catch (error) {
    console.error('Conversation response generation failed:', error);
    
    return {
      text: "I understand. Let me connect you with one of our human representatives who can better assist you.",
      shouldTransfer: true,
      shouldEndCall: false,
      intent: 'fallback',
      confidence: 0.5
    };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const callId = url.searchParams.get('callId') || 'browser-test'
  const assistantId = url.searchParams.get('assistantId') || 'demo'
  const userId = url.searchParams.get('userId')

  const upgradeHeader = req.headers.get('upgrade')
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    return new Response('Expected websocket connection', {
      status: 426,
      headers: { ...corsHeaders, Upgrade: 'websocket', Connection: 'Upgrade' },
    })
  }

  const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY')
  if (!deepgramApiKey) {
    return new Response('DeepGram API key not configured', { status: 500, headers: corsHeaders })
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req)
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let assistant: any = null
    let isCallActive = false
    let deepgramSTT: WebSocket | null = null
    let deepgramTTS: WebSocket | null = null
    let signalWireStreamSid: string | null = null
    let conversationBuffer: Array<{ role: string; content: string }> = []

    const log = (msg: string, data?: any) => 
      console.log(`[${new Date().toISOString()}] [Call: ${callId}] ${msg}`, data || '')

    // Load assistant configuration
    if (assistantId !== 'demo' && userId) {
      try {
        const { data: assistantData } = await supabaseClient
          .from('assistants')
          .select('*')
          .eq('id', assistantId)
          .eq('user_id', userId)
          .single()
        if (assistantData) {
          assistant = assistantData
          log('✅ Assistant loaded', { name: assistant.name, personality: assistant.system_prompt })
        }
      } catch (err) {
        log('⚠️ Error fetching assistant, using default', err)
      }
    }

    if (!assistant) {
      assistant = {
        name: 'DeepGram Assistant',
        first_message: 'Hello! This is your AI assistant powered by DeepGram. How can I help you today?',
        system_prompt: 'You are a helpful AI assistant. Be friendly, professional, and concise.'
      }
    }

    // Initialize DeepGram STT with proper error handling
    const initializeSTT = () => {
      try {
        const sttUrl = 'wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true&endpointing=300'
        deepgramSTT = new WebSocket(sttUrl, ['token', deepgramApiKey])

        deepgramSTT.onopen = () => {
          log('✅ DeepGram STT connected successfully')
        }

        deepgramSTT.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'Results' && data.channel?.alternatives?.[0]?.transcript) {
              const transcript = data.channel.alternatives[0].transcript
              const isFinal = data.is_final || false
              
              if (transcript.trim()) {
                log('📝 STT transcript:', { transcript, isFinal })
                
                socket.send(JSON.stringify({
                  type: 'transcript',
                  text: transcript,
                  confidence: data.channel.alternatives[0].confidence || 1.0,
                  isFinal,
                  timestamp: Date.now()
                }))

                if (isFinal) {
                  await processConversation(transcript)
                }
              }
            }
          } catch (error) {
            log('❌ Error processing STT message:', error)
          }
        }

        deepgramSTT.onerror = (error) => {
          log('❌ DeepGram STT error:', error)
          setTimeout(initializeSTT, 2000) // Reconnect after 2 seconds
        }

        deepgramSTT.onclose = (event) => {
          log('🔌 DeepGram STT closed:', event.code)
          if (isCallActive && event.code !== 1000) {
            setTimeout(initializeSTT, 2000) // Reconnect if not normal closure
          }
        }
      } catch (error) {
        log('❌ Error initializing STT:', error)
        setTimeout(initializeSTT, 2000)
      }
    }

    // Initialize DeepGram TTS with proper error handling
    const initializeTTS = () => {
      try {
        const ttsUrl = 'wss://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=linear16&sample_rate=8000'
        deepgramTTS = new WebSocket(ttsUrl, ['token', deepgramApiKey])

        deepgramTTS.onopen = () => {
          log('✅ DeepGram TTS connected successfully')
          // Send initial greeting
          if (assistant.first_message) {
            sendTTSMessage(assistant.first_message)
          }
        }

        deepgramTTS.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            try {
              // Convert audio to base64 and send to SignalWire
              const audioArray = new Uint8Array(event.data)
              const base64Audio = btoa(String.fromCharCode(...audioArray))
              
              if (signalWireStreamSid && socket.readyState === WebSocket.OPEN) {
                const mediaMessage = {
                  event: 'media',
                  streamSid: signalWireStreamSid,
                  media: {
                    payload: base64Audio
                  }
                }
                socket.send(JSON.stringify(mediaMessage))
                log('🔊 Audio sent to SignalWire')
              }
            } catch (error) {
              log('❌ Error processing TTS audio:', error)
            }
          }
        }

        deepgramTTS.onerror = (error) => {
          log('❌ DeepGram TTS error:', error)
          setTimeout(initializeTTS, 2000)
        }

        deepgramTTS.onclose = (event) => {
          log('🔌 DeepGram TTS closed:', event.code)
          if (isCallActive && event.code !== 1000) {
            setTimeout(initializeTTS, 2000)
          }
        }
      } catch (error) {
        log('❌ Error initializing TTS:', error)
        setTimeout(initializeTTS, 2000)
      }
    }

    const sendTTSMessage = (text: string) => {
      if (deepgramTTS && deepgramTTS.readyState === WebSocket.OPEN && text.trim()) {
        try {
          const message = {
            type: 'Speak',
            text: text.trim()
          }
          deepgramTTS.send(JSON.stringify(message))
          log('📤 TTS message sent:', text)
        } catch (error) {
          log('❌ Error sending TTS message:', error)
        }
      } else {
        log('⚠️ TTS not ready, queuing message:', text)
        // Queue message for when TTS reconnects
        setTimeout(() => sendTTSMessage(text), 1000)
      }
    }

    const processConversation = async (transcript: string) => {
      try {
        log('🧠 Processing conversation:', { input: transcript })
        
        // Add user message to conversation buffer
        conversationBuffer.push({ role: 'user', content: transcript })
        
        // Generate AI response using the conversation service
        const response = await generateConversationResponse(transcript, {
          callId,
          agentPrompt: assistant.system_prompt,
          agentPersonality: assistant.voice_provider === 'friendly' ? 'friendly' : 'professional',
          previousMessages: conversationBuffer
        })
        
        log('🤖 AI Response generated:', response)
        
        // Add AI response to conversation buffer
        conversationBuffer.push({ role: 'assistant', content: response.text })
        
        // Send response back to client
        socket.send(JSON.stringify({
          type: 'ai_response',
          text: response.text,
          intent: response.intent,
          confidence: response.confidence,
          shouldTransfer: response.shouldTransfer,
          shouldEndCall: response.shouldEndCall,
          timestamp: Date.now()
        }))

        // Convert response to speech
        sendTTSMessage(response.text)
        
        // Handle call actions
        if (response.shouldEndCall) {
          log('📴 Call should end')
          setTimeout(() => {
            socket.send(JSON.stringify({ type: 'end_call', reason: 'ai_decision' }))
          }, 3000) // Give time for TTS to finish
        } else if (response.shouldTransfer) {
          log('📞 Call should transfer')
          socket.send(JSON.stringify({ type: 'transfer_call', reason: 'ai_decision' }))
        }
        
      } catch (error) {
        log('❌ Error processing conversation:', error)
        const fallbackResponse = "I'm having trouble processing that. Let me connect you with someone who can help."
        sendTTSMessage(fallbackResponse)
      }
    }

    const cleanup = () => {
      isCallActive = false
      if (deepgramSTT) {
        deepgramSTT.close()
        deepgramSTT = null
      }
      if (deepgramTTS) {
        deepgramTTS.close()
        deepgramTTS = null
      }
      log('🧹 Cleanup completed')
    }

    // WebSocket event handlers
    socket.onopen = () => {
      log('🔌 SignalWire WebSocket connected')
      isCallActive = true
      
      // Initialize DeepGram connections
      initializeSTT()
      initializeTTS()
      
      socket.send(JSON.stringify({
        type: 'connection_established',
        callId,
        assistantId,
        assistant: { 
          name: assistant.name,
          personality: assistant.system_prompt,
          first_message: assistant.first_message
        },
        timestamp: Date.now(),
      }))
    }

    socket.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data)
        log('📨 Received message:', { event: msg.event || msg.type })
        
        switch (msg.event || msg.type) {
          case 'connected':
            log('📡 SignalWire stream connected')
            break
            
          case 'start':
            signalWireStreamSid = msg.streamSid
            log('🎙️ SignalWire stream started:', msg.streamSid)
            break
            
          case 'media':
            if (isCallActive && msg.media?.payload && deepgramSTT?.readyState === WebSocket.OPEN) {
              try {
                // Convert base64 audio to binary and send to DeepGram STT
                const binaryAudio = Uint8Array.from(atob(msg.media.payload), c => c.charCodeAt(0))
                deepgramSTT.send(binaryAudio)
              } catch (error) {
                log('❌ Error processing media:', error)
              }
            }
            break
            
          case 'stop':
            log('🛑 SignalWire stream stopped')
            isCallActive = false
            signalWireStreamSid = null
            cleanup()
            break
            
          case 'text_input':
            if (msg.text?.trim()) {
              await processConversation(msg.text)
            }
            break
            
          default:
            log('❓ Unknown SignalWire event:', msg)
        }
      } catch (err) {
        log('❌ Error processing SignalWire message:', err)
      }
    }

    socket.onclose = (ev) => {
      log('🔌 SignalWire WebSocket closed:', ev.code)
      cleanup()
    }

    socket.onerror = (err) => {
      log('❌ SignalWire WebSocket error:', err)
      cleanup()
    }

    return response
  } catch (error) {
    console.error('❌ Critical error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
