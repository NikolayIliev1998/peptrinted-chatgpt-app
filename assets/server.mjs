import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001; // Use Render's PORT or default to 3001

// AGGRESSIVE CORS FIX - Allow everything for now
app.use((req, res, next) => {
  console.log('=== CORS MIDDLEWARE ===');
  console.log('Request origin:', req.headers.origin);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('All headers:', JSON.stringify(req.headers, null, 2));
  
  // Set CORS headers for ALL requests - ALWAYS set them
  const origin = req.headers.origin;
  if (origin) {
    console.log('Setting CORS for origin:', origin);
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    console.log('No origin, setting wildcard');
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '86400');
  
  console.log('CORS headers set');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  console.log('=== ROOT ENDPOINT HIT ===');
  console.log('Root endpoint hit from origin:', req.headers.origin);
  res.json({ 
    message: 'ChatGPT Server is running!', 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    corsHeaders: res.getHeaders()
  });
});

// Test endpoint to verify server is running
app.get('/test', (req, res) => {
  console.log('=== TEST ENDPOINT HIT ===');
  console.log('Test endpoint hit from origin:', req.headers.origin);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Response headers being sent:', JSON.stringify(res.getHeaders(), null, 2));
  
  res.json({ 
    message: 'ChatGPT Server is running!', 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    corsHeaders: res.getHeaders()
  });
});

// ChatGPT endpoint
app.post('/chatgpt', async (req, res) => {
  try {
    const { message, ticketContext, orderContext, language = 'de' } = req.body;
    
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

    // Language-specific instructions
    const languageInstructions = {
      'de': 'Antworte immer höflich und professionell auf Deutsch',
      'en-us': 'Always respond politely and professionally in American English',
      'en-uk': 'Always respond politely and professionally in British English',
      'it': 'Rispondi sempre in modo educato e professionale in italiano',
      'es': 'Responde siempre de manera educada y profesional en español',
      'fr': 'Répondez toujours de manière polie et professionnelle en français',
      'nl': 'Antwoord altijd beleefd en professioneel in het Nederlands'
    };

    // Build context for better prompts
    let systemPrompt = `Du bist ein hilfreicher Kundenservice-Assistent für PetPrinted, ein Unternehmen, das personalisierte Haustierprodukte verkauft. 
    
    Wichtige Informationen:
    - ${languageInstructions[language] || languageInstructions['de']}
    - Sei hilfreich und lösungsorientiert
    - Wenn du keine Informationen hast, sage das ehrlich
    - Verwende eine freundliche, aber professionelle Tonart
    - Fokussiere dich auf Kundenservice und Problemlösung`;

    // Language-specific context labels
    const contextLabels = {
      'de': {
        ticket: 'Ticket-Kontext:',
        order: 'Bestellungs-Kontext:',
        subject: 'Betreff:',
        description: 'Beschreibung:',
        email: 'Kunden-E-Mail:',
        orderNumber: 'Bestellnummer:',
        customerName: 'Kundenname:',
        orderStatus: 'Bestellstatus:',
        totalPrice: 'Gesamtbetrag:',
        notAvailable: 'Nicht verfügbar'
      },
      'en-us': {
        ticket: 'Ticket Context:',
        order: 'Order Context:',
        subject: 'Subject:',
        description: 'Description:',
        email: 'Customer Email:',
        orderNumber: 'Order Number:',
        customerName: 'Customer Name:',
        orderStatus: 'Order Status:',
        totalPrice: 'Total Price:',
        notAvailable: 'Not available'
      },
      'en-uk': {
        ticket: 'Ticket Context:',
        order: 'Order Context:',
        subject: 'Subject:',
        description: 'Description:',
        email: 'Customer Email:',
        orderNumber: 'Order Number:',
        customerName: 'Customer Name:',
        orderStatus: 'Order Status:',
        totalPrice: 'Total Price:',
        notAvailable: 'Not available'
      },
      'it': {
        ticket: 'Contesto Ticket:',
        order: 'Contesto Ordine:',
        subject: 'Oggetto:',
        description: 'Descrizione:',
        email: 'Email Cliente:',
        orderNumber: 'Numero Ordine:',
        customerName: 'Nome Cliente:',
        orderStatus: 'Stato Ordine:',
        totalPrice: 'Prezzo Totale:',
        notAvailable: 'Non disponibile'
      },
      'es': {
        ticket: 'Contexto del Ticket:',
        order: 'Contexto del Pedido:',
        subject: 'Asunto:',
        description: 'Descripción:',
        email: 'Email del Cliente:',
        orderNumber: 'Número de Pedido:',
        customerName: 'Nombre del Cliente:',
        orderStatus: 'Estado del Pedido:',
        totalPrice: 'Precio Total:',
        notAvailable: 'No disponible'
      },
      'fr': {
        ticket: 'Contexte du Ticket:',
        order: 'Contexte de la Commande:',
        subject: 'Sujet:',
        description: 'Description:',
        email: 'Email du Client:',
        orderNumber: 'Numéro de Commande:',
        customerName: 'Nom du Client:',
        orderStatus: 'Statut de la Commande:',
        totalPrice: 'Prix Total:',
        notAvailable: 'Non disponible'
      },
      'nl': {
        ticket: 'Ticket Context:',
        order: 'Bestelling Context:',
        subject: 'Onderwerp:',
        description: 'Beschrijving:',
        email: 'Klant Email:',
        orderNumber: 'Bestelnummer:',
        customerName: 'Klantnaam:',
        orderStatus: 'Bestelling Status:',
        totalPrice: 'Totale Prijs:',
        notAvailable: 'Niet beschikbaar'
      }
    };

    const labels = contextLabels[language] || contextLabels['de'];

    if (ticketContext) {
      systemPrompt += `\n\n${labels.ticket}
      - ${labels.subject} ${ticketContext.subject || labels.notAvailable}
      - ${labels.description} ${ticketContext.description || labels.notAvailable}
      - ${labels.email} ${ticketContext.email || labels.notAvailable}`;
    }

    if (orderContext) {
      systemPrompt += `\n\n${labels.order}
      - ${labels.orderNumber} ${orderContext.orderName || labels.notAvailable}
      - ${labels.customerName} ${orderContext.customerName || labels.notAvailable}
      - ${labels.orderStatus} ${orderContext.orderStatus || labels.notAvailable}
      - ${labels.totalPrice} ${orderContext.totalPrice || labels.notAvailable}`;
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
