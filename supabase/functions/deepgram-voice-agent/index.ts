
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, UPGRADE',
}

console.log('🎙️ Deepgram Voice Agent WebSocket v4.0 - Real-time Voice Chat with Proper Authentication')

serve(async (req) => {
  console.log('🚀 deepgram-voice-agent function invoked', {
    method: req.method,
    url: req.url,
    upgradeHeader: req.headers.get('upgrade'),
    connectionHeader: req.headers.get('connection'),
  })

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  // Verify WebSocket upgrade headers
  const upgradeHeader = req.headers.get('upgrade')
  
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    console.log('❌ Not a valid WebSocket upgrade request', { upgradeHeader })
    return new Response('Expected websocket connection', {
      status: 426,
      headers: { ...corsHeaders, Upgrade: 'websocket', Connection: 'Upgrade' },
    })
  }

  // Check required environment variables
  const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY')
  const huggingFaceApi = Deno.env.get('HUGGING_FACE_API')
  
  if (!deepgramApiKey) {
    console.error('❌ Missing DEEPGRAM_API_KEY')
    return new Response('DEEPGRAM_API_KEY not configured', { status: 500, headers: corsHeaders })
  }
  
  if (!huggingFaceApi) {
    console.error('❌ Missing HUGGING_FACE_API')
    return new Response('HUGGING_FACE_API not configured', { status: 500, headers: corsHeaders })
  }

  try {
    console.log('🔄 Attempting WebSocket upgrade...')
    const { socket, response } = Deno.upgradeWebSocket(req)
    console.log('✅ WebSocket upgrade successful')

    let deepgramSTT: WebSocket | null = null
    let deepgramTTS: WebSocket | null = null
    let isConnected = false
    let assistant: any = null
    let conversationHistory: Array<{ role: string; content: string }> = []
    let assistantId = 'demo'
    let userId = 'demo-user'

    const log = (msg: string, data?: any) => console.log(`[${new Date().toISOString()}] [${assistantId}] ${msg}`, data || '')

    const sendToClient = (message: any) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
      }
    }

    // Initialize Deepgram STT connection with proper authentication
    const connectSTT = async () => {
      try {
        log('🔗 Connecting to Deepgram STT with proper authentication...')
        
        // Use the correct WebSocket URL with protocol-based authentication
        const sttUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true&endpointing=300&utterance_end_ms=1000&vad_events=true&punctuate=true`
        
        // Create WebSocket with token protocol for authentication
        deepgramSTT = new WebSocket(sttUrl, ['token', deepgramApiKey])

        deepgramSTT.onopen = () => {
          log('✅ Deepgram STT connected successfully')
          sendToClient({
            type: 'stt_connected',
            timestamp: Date.now()
          })
        }

        deepgramSTT.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'Results' && data.channel?.alternatives?.[0]) {
              const transcript = data.channel.alternatives[0].transcript.trim()
              const isFinal = data.is_final || false
              const speechFinal = data.speech_final || false
              
              if (transcript && transcript.length > 2) {
                log('📝 Transcript received:', { transcript, isFinal, speechFinal })
                
                // Send transcript to client
                sendToClient({
                  type: 'transcript',
                  text: transcript,
                  isFinal,
                  speechFinal,
                  timestamp: Date.now()
                })

                // Process final transcripts
                if (speechFinal || isFinal) {
                  await processTranscript(transcript)
                }
              }
            }

            if (data.type === 'UtteranceEnd') {
              log('🔚 Utterance end detected')
            }

            if (data.type === 'SpeechStarted') {
              log('🎤 Speech detection started')
            }
            
          } catch (error) {
            log('❌ Error processing STT message:', error)
          }
        }

        deepgramSTT.onerror = (error) => {
          log('❌ Deepgram STT error:', error)
          sendToClient({
            type: 'error',
            error: 'Speech recognition error',
            timestamp: Date.now()
          })
          // Reconnect after delay
          setTimeout(connectSTT, 2000)
        }

        deepgramSTT.onclose = (event) => {
          log('🔌 Deepgram STT closed:', { code: event.code, reason: event.reason })
          if (isConnected && event.code !== 1000) {
            setTimeout(connectSTT, 2000)
          }
        }

      } catch (error) {
        log('❌ Failed to connect STT:', error)
        sendToClient({
          type: 'error',
          error: 'Failed to connect speech recognition',
          timestamp: Date.now()
        })
      }
    }

    // Initialize Deepgram TTS connection with proper authentication
    const connectTTS = async () => {
      try {
        log('🔗 Connecting to Deepgram TTS with proper authentication...')
        
        const voiceModel = assistant?.voice_id || 'aura-asteria-en'
        const ttsUrl = `wss://api.deepgram.com/v1/speak?model=${voiceModel}&encoding=linear16&sample_rate=24000&container=none`
        
        // Create WebSocket with token protocol for authentication
        deepgramTTS = new WebSocket(ttsUrl, ['token', deepgramApiKey])

        deepgramTTS.onopen = () => {
          log('✅ Deepgram TTS connected successfully')
          sendToClient({
            type: 'tts_connected',
            timestamp: Date.now()
          })
          
          // Send initial greeting if available
          if (assistant?.first_message) {
            setTimeout(() => {
              sendTTSMessage(assistant.first_message)
            }, 500)
          }
        }

        deepgramTTS.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            // Convert audio data to base64 and send to client
            const audioData = new Uint8Array(event.data)
            const base64Audio = btoa(String.fromCharCode(...audioData))
            
            sendToClient({
              type: 'audio_response',
              audio: base64Audio,
              timestamp: Date.now()
            })
          }
        }

        deepgramTTS.onerror = (error) => {
          log('❌ Deepgram TTS error:', error)
          setTimeout(connectTTS, 2000)
        }

        deepgramTTS.onclose = (event) => {
          log('🔌 Deepgram TTS closed:', { code: event.code, reason: event.reason })
          if (isConnected && event.code !== 1000) {
            setTimeout(connectTTS, 2000)
          }
        }

      } catch (error) {
        log('❌ Failed to connect TTS:', error)
      }
    }

    // Process transcript and get AI response
    const processTranscript = async (transcript: string) => {
      try {
        log('🤖 Processing transcript with AI...', { transcript })
        
        // Add user message to conversation history
        conversationHistory.push({ role: 'user', content: transcript })
        
        // Keep only last 10 messages to avoid token limits
        if (conversationHistory.length > 10) {
          conversationHistory = conversationHistory.slice(-10)
        }

        // Prepare context for Hugging Face
        const systemPrompt = assistant?.system_prompt || 'You are a helpful voice assistant. Be friendly, conversational, and keep responses concise since this is a voice conversation.'
        
        // Create conversation context
        let conversationContext = systemPrompt + '\n\n'
        conversationHistory.forEach(msg => {
          if (msg.role === 'user') {
            conversationContext += `Human: ${msg.content}\n`
          } else if (msg.role === 'assistant') {
            conversationContext += `Assistant: ${msg.content}\n`
          }
        })
        conversationContext += `Human: ${transcript}\nAssistant:`

        // Call Hugging Face API
        const hfResponse = await fetch(
          'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${huggingFaceApi}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: conversationContext,
              parameters: {
                max_new_tokens: assistant?.max_tokens || 150,
                temperature: assistant?.temperature || 0.8,
                do_sample: true,
                top_p: 0.9,
                return_full_text: false
              }
            }),
          }
        )

        if (!hfResponse.ok) {
          throw new Error(`Hugging Face API error: ${hfResponse.status}`)
        }

        const hfData = await hfResponse.json()
        let aiResponse = ''
        
        if (Array.isArray(hfData) && hfData.length > 0) {
          aiResponse = hfData[0].generated_text?.trim() || ''
        }

        // Clean up the response
        if (aiResponse) {
          // Remove the input context from response
          aiResponse = aiResponse.replace(conversationContext, '').trim()
          // Remove any role prefixes
          aiResponse = aiResponse.replace(/^(Assistant:|AI:|Bot:)\s*/i, '').trim()
          
          // Ensure response is appropriate for voice
          if (aiResponse.length > 300) {
            aiResponse = aiResponse.substring(0, 300) + '...'
          }
        }

        if (!aiResponse) {
          aiResponse = "I understand. Could you tell me more about that?"
        }

        log('✅ AI response generated:', aiResponse.substring(0, 100))
        
        // Add assistant response to conversation history
        conversationHistory.push({ role: 'assistant', content: aiResponse })
        
        // Send text response to client
        sendToClient({
          type: 'ai_response',
          text: aiResponse,
          timestamp: Date.now()
        })

        // Convert to speech
        await sendTTSMessage(aiResponse)

      } catch (error) {
        log('❌ Error processing transcript:', error)
        const fallbackResponse = "I'm having trouble processing your request. Could you please try again?"
        
        sendToClient({
          type: 'ai_response',
          text: fallbackResponse,
          timestamp: Date.now()
        })
        
        await sendTTSMessage(fallbackResponse)
      }
    }

    // Send text to TTS
    const sendTTSMessage = async (text: string) => {
      try {
        if (deepgramTTS && deepgramTTS.readyState === WebSocket.OPEN) {
          log('🔊 Converting text to speech:', text.substring(0, 100))
          
          // Clear any previous audio
          deepgramTTS.send(JSON.stringify({ type: 'Clear' }))
          
          // Send text to convert
          setTimeout(() => {
            if (deepgramTTS && deepgramTTS.readyState === WebSocket.OPEN) {
              deepgramTTS.send(JSON.stringify({
                type: 'Speak',
                text: text
              }))
              
              // Flush after sending
              setTimeout(() => {
                if (deepgramTTS && deepgramTTS.readyState === WebSocket.OPEN) {
                  deepgramTTS.send(JSON.stringify({ type: 'Flush' }))
                }
              }, 100)
            }
          }, 100)
        }
      } catch (error) {
        log('❌ Error sending TTS message:', error)
      }
    }

    // Load assistant configuration
    const loadAssistant = async (id: string) => {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const { data } = await supabase
          .from('assistants')
          .select('*')
          .eq('id', id)
          .single()

        if (data) {
          assistant = data
          log('✅ Assistant loaded successfully:', assistant.name)
        } else {
          // Use default assistant
          assistant = {
            id: id,
            name: 'Demo Assistant',
            system_prompt: 'You are a helpful voice assistant. Be friendly, conversational, and keep responses concise since this is a voice conversation.',
            first_message: 'Hello! I can hear you clearly. How can I help you today?',
            voice_id: 'aura-asteria-en',
            model: 'nova-2',
            temperature: 0.8,
            max_tokens: 150
          }
          log('🤖 Using default assistant configuration')
        }

        // Send assistant info to client
        sendToClient({
          type: 'connection_established',
          assistant: {
            name: assistant.name,
            first_message: assistant.first_message
          },
          timestamp: Date.now()
        })

      } catch (error) {
        log('❌ Error loading assistant:', error)
        // Use fallback
        assistant = {
          id: id,
          name: 'Demo Assistant',
          system_prompt: 'You are a helpful voice assistant.',
          first_message: 'Hello! How can I help you today?',
          voice_id: 'aura-asteria-en'
        }
      }
    }

    // Client WebSocket handlers
    socket.onopen = async () => {
      log('🔌 Client WebSocket connected')
      isConnected = true
    }

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data)
        log('📨 Received from client:', { event: message.event || message.type })

        switch (message.event || message.type) {
          case 'connected':
            // Initialize connection
            assistantId = message.assistantId || 'demo'
            userId = message.userId || 'demo-user'
            
            log('🔐 Client connected with assistant:', assistantId)
            
            // Load assistant and initialize connections
            await loadAssistant(assistantId)
            await connectSTT()
            await connectTTS()
            
            // Send ready status
            setTimeout(() => {
              sendToClient({
                type: 'ready',
                status: 'Ready to chat',
                assistant: assistant?.name,
                timestamp: Date.now()
              })
            }, 1000)
            break

          case 'media':
            // Forward audio to Deepgram STT
            if (deepgramSTT && deepgramSTT.readyState === WebSocket.OPEN && message.media?.payload) {
              try {
                const audioBuffer = Uint8Array.from(atob(message.media.payload), c => c.charCodeAt(0))
                deepgramSTT.send(audioBuffer)
              } catch (error) {
                log('❌ Error forwarding audio to STT:', error)
              }
            }
            break

          case 'text_input':
            if (message.text) {
              await processTranscript(message.text)
            }
            break

          case 'ping':
            sendToClient({
              type: 'pong',
              timestamp: Date.now()
            })
            break

          default:
            log('❓ Unknown message event:', message.event || message.type)
        }

      } catch (error) {
        log('❌ Error processing client message:', error)
      }
    }

    socket.onclose = (event) => {
      log('🔌 Client WebSocket closed:', { code: event.code, reason: event.reason })
      isConnected = false
      
      // Clean up Deepgram connections
      if (deepgramSTT) {
        deepgramSTT.close()
        deepgramSTT = null
      }
      
      if (deepgramTTS) {
        deepgramTTS.close()
        deepgramTTS = null
      }
    }

    socket.onerror = (error) => {
      log('❌ Client WebSocket error:', error)
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
