
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('uploads'));

// Database setup
const dbPath = path.join(__dirname, 'voice-agent.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Voice agents/assistants table
  db.run(`CREATE TABLE IF NOT EXISTS assistants (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    first_message TEXT,
    voice_id TEXT,
    voice_provider TEXT DEFAULT 'openai',
    model TEXT DEFAULT 'gpt-3.5-turbo',
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Calls table
  db.run(`CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    assistant_id TEXT,
    phone_number TEXT,
    status TEXT DEFAULT 'pending',
    duration INTEGER,
    transcript TEXT,
    summary TEXT,
    recording_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (assistant_id) REFERENCES assistants (id)
  )`);

  // Call logs table
  db.run(`CREATE TABLE IF NOT EXISTS call_logs (
    id TEXT PRIMARY KEY,
    call_id TEXT NOT NULL,
    speaker TEXT NOT NULL,
    message TEXT NOT NULL,
    confidence REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (call_id) REFERENCES calls (id)
  )`);

  // Agent templates table
  db.run(`CREATE TABLE IF NOT EXISTS agent_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    template_data TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by TEXT NOT NULL,
    downloads_count INTEGER DEFAULT 0,
    rating_average REAL DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  // Campaigns table
  db.run(`CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    total_calls INTEGER DEFAULT 0,
    completed_calls INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Contacts table
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    campaign_id TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    company TEXT,
    custom_fields TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
  )`);

  // API keys table
  db.run(`CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Insert some sample data
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      const hashedPassword = bcrypt.hashSync('password123', 10);
      db.run(`INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)`, 
        [uuidv4(), 'demo@example.com', hashedPassword, 'Demo User']);

      // Insert sample templates
      const sampleTemplates = [
        {
          id: uuidv4(),
          name: 'Customer Support Agent',
          description: 'Helpful customer service assistant',
          category: 'Support',
          template_data: JSON.stringify({
            system_prompt: 'You are a helpful customer support agent.',
            first_message: 'Hello! How can I help you today?',
            voice_id: 'alloy'
          }),
          is_public: true,
          created_by: 'system'
        },
        {
          id: uuidv4(),
          name: 'Sales Representative',
          description: 'Friendly sales assistant',
          category: 'Sales',
          template_data: JSON.stringify({
            system_prompt: 'You are a friendly sales representative.',
            first_message: 'Hi there! I\'d love to tell you about our services.',
            voice_id: 'nova'
          }),
          is_public: true,
          created_by: 'system'
        }
      ];

      sampleTemplates.forEach(template => {
        db.run(`INSERT INTO agent_templates (id, name, description, category, template_data, is_public, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
          [template.id, template.name, template.description, template.category, 
           template.template_data, template.is_public, template.created_by]);
      });
    }
  });
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.run(`INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)`,
      [userId, email, hashedPassword, name], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Failed to create user' });
        }

        const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ user: { id: userId, email, name }, token });
      });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }

      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ 
        user: { id: user.id, email: user.email, name: user.name }, 
        token 
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/auth/user', authenticateToken, (req, res) => {
  db.get(`SELECT id, email, name FROM users WHERE id = ?`, [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  });
});

// Assistants routes
app.get('/assistants', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM assistants WHERE user_id = ? ORDER BY created_at DESC`, 
    [req.user.userId], (err, assistants) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ data: assistants });
    });
});

app.post('/assistants', authenticateToken, (req, res) => {
  const { name, system_prompt, first_message, voice_id, voice_provider, model, temperature, max_tokens } = req.body;
  const assistantId = uuidv4();

  db.run(`INSERT INTO assistants (id, user_id, name, system_prompt, first_message, voice_id, voice_provider, model, temperature, max_tokens) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [assistantId, req.user.userId, name, system_prompt, first_message, voice_id, voice_provider, model, temperature, max_tokens],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create assistant' });
      }

      db.get(`SELECT * FROM assistants WHERE id = ?`, [assistantId], (err, assistant) => {
        if (err) {
          return res.status(500).json({ error: 'Server error' });
        }
        res.status(201).json({ data: assistant });
      });
    });
});

app.put('/assistants/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, system_prompt, first_message, voice_id, voice_provider, model, temperature, max_tokens } = req.body;

  db.run(`UPDATE assistants SET name = ?, system_prompt = ?, first_message = ?, voice_id = ?, 
          voice_provider = ?, model = ?, temperature = ?, max_tokens = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND user_id = ?`,
    [name, system_prompt, first_message, voice_id, voice_provider, model, temperature, max_tokens, id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update assistant' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Assistant not found' });
      }

      db.get(`SELECT * FROM assistants WHERE id = ?`, [id], (err, assistant) => {
        if (err) {
          return res.status(500).json({ error: 'Server error' });
        }
        res.json({ data: assistant });
      });
    });
});

app.delete('/assistants/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM assistants WHERE id = ? AND user_id = ?`, [id, req.user.userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete assistant' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Assistant not found' });
    }

    res.json({ message: 'Assistant deleted successfully' });
  });
});

// Agent templates routes
app.get('/agent-templates', (req, res) => {
  db.all(`SELECT * FROM agent_templates WHERE is_public = true ORDER BY created_at DESC`, (err, templates) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json({ data: templates });
  });
});

// Calls routes
app.get('/calls', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM calls WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`, 
    [req.user.userId], (err, calls) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ data: calls });
    });
});

app.post('/calls', authenticateToken, (req, res) => {
  const { assistant_id, phone_number } = req.body;
  const callId = uuidv4();

  db.run(`INSERT INTO calls (id, user_id, assistant_id, phone_number, status) VALUES (?, ?, ?, ?, ?)`,
    [callId, req.user.userId, assistant_id, phone_number, 'initiated'], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create call' });
      }

      db.get(`SELECT * FROM calls WHERE id = ?`, [callId], (err, call) => {
        if (err) {
          return res.status(500).json({ error: 'Server error' });
        }
        res.status(201).json({ data: call });
      });
    });
});

// Call logs routes
app.get('/calls/:callId/logs', authenticateToken, (req, res) => {
  const { callId } = req.params;

  db.all(`SELECT cl.* FROM call_logs cl 
          JOIN calls c ON cl.call_id = c.id 
          WHERE cl.call_id = ? AND c.user_id = ? 
          ORDER BY cl.timestamp ASC`, 
    [callId, req.user.userId], (err, logs) => {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ data: logs });
    });
});

// Dashboard stats
app.get('/dashboard/stats', authenticateToken, (req, res) => {
  const stats = {};

  // Get total assistants
  db.get(`SELECT COUNT(*) as count FROM assistants WHERE user_id = ?`, [req.user.userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    stats.totalAssistants = result.count;

    // Get total calls
    db.get(`SELECT COUNT(*) as count FROM calls WHERE user_id = ?`, [req.user.userId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      stats.totalCalls = result.count;

      // Get active calls
      db.get(`SELECT COUNT(*) as count FROM calls WHERE user_id = ? AND status IN ('initiated', 'in-progress')`, 
        [req.user.userId], (err, result) => {
          if (err) return res.status(500).json({ error: 'Server error' });
          stats.activeCalls = result.count;

          // Get success rate (completed calls / total calls)
          db.get(`SELECT COUNT(*) as count FROM calls WHERE user_id = ? AND status = 'completed'`, 
            [req.user.userId], (err, result) => {
              if (err) return res.status(500).json({ error: 'Server error' });
              stats.successRate = stats.totalCalls > 0 ? (result.count / stats.totalCalls * 100) : 0;

              res.json({ data: stats });
            });
        });
    });
  });
});

// API Keys routes
app.get('/api-keys', authenticateToken, (req, res) => {
  db.all(`SELECT provider FROM api_keys WHERE user_id = ?`, [req.user.userId], (err, keys) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json({ data: keys });
  });
});

app.post('/api-keys', authenticateToken, (req, res) => {
  const { provider, api_key } = req.body;

  db.run(`INSERT OR REPLACE INTO api_keys (id, user_id, provider, api_key) VALUES (?, ?, ?, ?)`,
    [uuidv4(), req.user.userId, provider, api_key], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save API key' });
      }
      res.json({ message: 'API key saved successfully' });
    });
});

// TTS/STT routes using OpenAI
app.post('/tts', authenticateToken, async (req, res) => {
  try {
    const { text, voice = 'alloy' } = req.body;

    // Get user's OpenAI API key
    db.get(`SELECT api_key FROM api_keys WHERE user_id = ? AND provider = 'openai'`, 
      [req.user.userId], async (err, result) => {
        if (err || !result) {
          return res.status(400).json({ error: 'OpenAI API key not configured' });
        }

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${result.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: voice
          })
        });

        if (!response.ok) {
          return res.status(500).json({ error: 'TTS generation failed' });
        }

        const audioBuffer = await response.arrayBuffer();
        res.set('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(audioBuffer));
      });
  } catch (error) {
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

app.post('/stt', authenticateToken, async (req, res) => {
  try {
    const { audio } = req.body;

    // Get user's OpenAI API key
    db.get(`SELECT api_key FROM api_keys WHERE user_id = ? AND provider = 'openai'`, 
      [req.user.userId], async (err, result) => {
        if (err || !result) {
          return res.status(400).json({ error: 'OpenAI API key not configured' });
        }

        // Convert base64 audio to buffer
        const audioBuffer = Buffer.from(audio, 'base64');
        
        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: 'audio/webm' });
        formData.append('file', blob, 'audio.webm');
        formData.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${result.api_key}`
          },
          body: formData
        });

        if (!response.ok) {
          return res.status(500).json({ error: 'STT transcription failed' });
        }

        const transcription = await response.json();
        res.json({ text: transcription.text });
      });
  } catch (error) {
    res.status(500).json({ error: 'STT transcription failed' });
  }
});

// AI Chat route
app.post('/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { messages, assistant_id } = req.body;

    // Get assistant details
    db.get(`SELECT * FROM assistants WHERE id = ? AND user_id = ?`, 
      [assistant_id, req.user.userId], async (err, assistant) => {
        if (err || !assistant) {
          return res.status(404).json({ error: 'Assistant not found' });
        }

        // Get user's OpenAI API key
        db.get(`SELECT api_key FROM api_keys WHERE user_id = ? AND provider = 'openai'`, 
          [req.user.userId], async (err, result) => {
            if (err || !result) {
              return res.status(400).json({ error: 'OpenAI API key not configured' });
            }

            const systemMessage = { role: 'system', content: assistant.system_prompt };
            const allMessages = [systemMessage, ...messages];

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${result.api_key}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: assistant.model || 'gpt-3.5-turbo',
                messages: allMessages,
                temperature: assistant.temperature || 0.7,
                max_tokens: assistant.max_tokens || 1000
              })
            });

            if (!response.ok) {
              return res.status(500).json({ error: 'AI chat failed' });
            }

            const completion = await response.json();
            res.json({ 
              message: completion.choices[0].message.content,
              usage: completion.usage
            });
          });
      });
  } catch (error) {
    res.status(500).json({ error: 'AI chat failed' });
  }
});

// WebSocket handling for voice chat
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'start_conversation':
          ws.send(JSON.stringify({
            type: 'connection_established',
            data: { message: 'Voice chat connected' }
          }));
          break;

        case 'audio_data':
          // Handle audio transcription
          ws.send(JSON.stringify({
            type: 'transcript',
            data: { text: 'Audio received and processed', isFinal: true }
          }));
          break;

        case 'text_message':
          // Handle text message and generate AI response
          ws.send(JSON.stringify({
            type: 'ai_response',
            data: { text: `Echo: ${data.message}` }
          }));
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to process message' }
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Local backend server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
