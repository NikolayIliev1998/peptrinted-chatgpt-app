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
    
    console.log('Received language:', language);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // OpenAI API key from environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ 
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' 
      });
    }

    // Language-specific system prompts
    const systemPrompts = {
      'de': `Du bist ein hilfreicher Kundenservice-Assistent für PetPrinted, ein Unternehmen, das personalisierte Haustierprodukte verkauft. 
    
    Wichtige Informationen:
    - Antworte immer höflich und professionell auf Deutsch
    - Sei hilfreich und lösungsorientiert
    - Wenn du keine Informationen hast, sage das ehrlich
    - Verwende eine freundliche, aber professionelle Tonart
    - Fokussiere dich auf Kundenservice und Problemlösung`,
      
      'en-us': `You are a helpful customer service assistant for PetPrinted, a company that sells personalized pet products.
    
    CRITICAL: You MUST respond ONLY in American English, regardless of what language the user writes in.
    
    Important information:
    - Always respond politely and professionally in American English ONLY
    - Ignore the user's input language - respond in English even if they write in German, Spanish, etc.
    - Be helpful and solution-oriented
    - If you don't have information, say so honestly
    - Use a friendly but professional tone
    - Focus on customer service and problem solving`,
      
      'en-uk': `You are a helpful customer service assistant for PetPrinted, a company that sells personalised pet products.
    
    CRITICAL: You MUST respond ONLY in British English, regardless of what language the user writes in.
    
    Important information:
    - Always respond politely and professionally in British English ONLY
    - Ignore the user's input language - respond in English even if they write in German, Spanish, etc.
    - Be helpful and solution-oriented
    - If you don't have information, say so honestly
    - Use a friendly but professional tone
    - Focus on customer service and problem solving`,
      
      'it': `Sei un assistente di servizio clienti utile per PetPrinted, un'azienda che vende prodotti per animali personalizzati.
    
    CRITICO: Devi rispondere SOLO in italiano, indipendentemente dalla lingua in cui scrive l'utente.
    
    Informazioni importanti:
    - Rispondi sempre in modo educato e professionale SOLO in italiano
    - Ignora la lingua dell'input dell'utente - rispondi in italiano anche se scrivono in tedesco, inglese, ecc.
    - Sii utile e orientato alle soluzioni
    - Se non hai informazioni, dillo onestamente
    - Usa un tono amichevole ma professionale
    - Concentrati sul servizio clienti e sulla risoluzione dei problemi`,
      
      'es': `Eres un asistente de servicio al cliente útil para PetPrinted, una empresa que vende productos para mascotas personalizados.
    
    CRÍTICO: Debes responder SOLO en español, independientemente del idioma en que escriba el usuario.
    
    Información importante:
    - Responde siempre de manera educada y profesional SOLO en español
    - Ignora el idioma del input del usuario - responde en español aunque escriban en alemán, inglés, etc.
    - Sé útil y orientado a soluciones
    - Si no tienes información, dilo honestamente
    - Usa un tono amigable pero profesional
    - Enfócate en el servicio al cliente y la resolución de problemas`,
      
      'fr': `Vous êtes un assistant de service client utile pour PetPrinted, une entreprise qui vend des produits pour animaux de compagnie personnalisés.
    
    CRITIQUE: Vous DEVEZ répondre UNIQUEMENT en français, peu importe la langue dans laquelle l'utilisateur écrit.
    
    Informations importantes:
    - Répondez toujours de manière polie et professionnelle UNIQUEMENT en français
    - Ignorez la langue de l'input de l'utilisateur - répondez en français même s'ils écrivent en allemand, anglais, etc.
    - Soyez utile et orienté solution
    - Si vous n'avez pas d'informations, dites-le honnêtement
    - Utilisez un ton amical mais professionnel
    - Concentrez-vous sur le service client et la résolution de problèmes`,
      
      'nl': `Je bent een behulpzame klantenservice-assistent voor PetPrinted, een bedrijf dat gepersonaliseerde huisdierproducten verkoopt.
    
    KRITIEK: Je MOET alleen in het Nederlands antwoorden, ongeacht in welke taal de gebruiker schrijft.
    
    Belangrijke informatie:
    - Antwoord altijd beleefd en professioneel ALLEEN in het Nederlands
    - Negeer de taal van de gebruiker - antwoord in het Nederlands ook als ze in het Duits, Engels, etc. schrijven
    - Wees behulpzaam en oplossingsgericht
    - Als je geen informatie hebt, zeg dat dan eerlijk
    - Gebruik een vriendelijke maar professionele toon
    - Focus op klantenservice en probleemoplossing`
    };

    // Build context for better prompts
    let systemPrompt = systemPrompts[language] || systemPrompts['de'];

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

    // Add final language enforcement
    systemPrompt += `\n\nIMPORTANT: Respond ONLY in the language specified above. Do not respond in German or any other language.`;
    
    console.log('System prompt being sent to ChatGPT:', systemPrompt);
    
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
