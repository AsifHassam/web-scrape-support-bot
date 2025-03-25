
import express from 'express';
import cors from 'cors';
import { chatbotService } from './utils/chatbot';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// API endpoint for chat
app.get('/api/chat', async (req, res) => {
  const { botId, message } = req.query;
  
  if (!botId || !message) {
    return res.status(400).json({ 
      error: 'Missing required parameters: botId and message are required' 
    });
  }
  
  if (typeof message !== 'string') {
    return res.status(400).json({
      error: 'Message must be a string'
    });
  }
  
  try {
    // Use the chatbot service to generate a response
    const response = await chatbotService.sendMessage(message);
    
    // Return the response to the client
    return res.status(200).json({ response: response.content });
  } catch (error) {
    console.error('Error generating response:', error);
    return res.status(500).json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

// Export for testing or importing elsewhere
export { app };
