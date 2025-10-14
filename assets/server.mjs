import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001; // Use Render's PORT or default to 3001

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow Zendesk domains
    if (origin.match(/^https:\/\/.*\.apps\.zdusercontent\.com$/) ||
        origin.match(/^https:\/\/.*\.zendesk\.com$/) ||
        origin === 'http://localhost:3001' ||
        origin === 'http://localhost:3000') {
      return callback(null, true);
    }
    
    // For development, allow any localhost
    if (process.env.NODE_ENV !== 'production' && origin.match(/^http:\/\/localhost/)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Test endpoint to verify server is running
app.get('/test', (req, res) => {
  res.json({ message: 'ChatGPT Server is running!', timestamp: new Date().toISOString() });
});

// ChatGPT endpoint
app.post('/chatgpt', async (req, res) => {
  try {
    const { message, ticketContext, orderContext } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // OpenAI API key from environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' 
      });
    }

    // Build context for better prompts
    let systemPrompt = `Du bist ein hilfreicher Kundenservice-Assistent für PetPrinted, ein Unternehmen, das personalisierte Haustierprodukte verkauft. 
    
    Wichtige Informationen:
    - Antworte immer höflich und professionell auf Deutsch
    - Sei hilfreich und lösungsorientiert
    - Wenn du keine Informationen hast, sage das ehrlich
    - Verwende eine freundliche, aber professionelle Tonart
    - Fokussiere dich auf Kundenservice und Problemlösung`;

    if (ticketContext) {
      systemPrompt += `\n\nTicket-Kontext:
      - Betreff: ${ticketContext.subject || 'Nicht verfügbar'}
      - Beschreibung: ${ticketContext.description || 'Nicht verfügbar'}
      - Kunden-E-Mail: ${ticketContext.email || 'Nicht verfügbar'}`;
    }

    if (orderContext) {
      systemPrompt += `\n\nBestellungs-Kontext:
      - Bestellnummer: ${orderContext.orderName || 'Nicht verfügbar'}
      - Kundenname: ${orderContext.customerName || 'Nicht verfügbar'}
      - Bestellstatus: ${orderContext.orderStatus || 'Nicht verfügbar'}
      - Gesamtbetrag: ${orderContext.totalPrice || 'Nicht verfügbar'}`;
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const chatGPTResponse = response.data.choices[0].message.content;
    
    res.json({
      response: chatGPTResponse,
      success: true
    });

  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    
    let errorMessage = 'Fehler bei der Kommunikation mit ChatGPT';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'OpenAI API-Schlüssel ist ungültig oder nicht konfiguriert';
      } else if (error.response.status === 429) {
        errorMessage = 'Zu viele Anfragen an ChatGPT. Bitte versuchen Sie es später erneut';
      } else if (error.response.data && error.response.data.error) {
        errorMessage = `ChatGPT Fehler: ${error.response.data.error.message}`;
      }
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`ChatGPT Server is running on http://localhost:${port}`);
});
