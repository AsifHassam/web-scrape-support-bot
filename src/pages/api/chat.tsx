
import { chatbotService } from '@/utils/chatbot';

// This is a simple API endpoint that will handle chat requests from the widget
export default function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { botId, message } = req.query;
  
  if (!botId || !message) {
    return res.status(400).json({ 
      error: 'Missing required parameters: botId and message are required' 
    });
  }
  
  // For now, we'll use the chatbot service directly
  chatbotService.sendMessage(message)
    .then(response => {
      return res.status(200).json({ response: response.content });
    })
    .catch(error => {
      console.error('Error generating response:', error);
      return res.status(500).json({ 
        error: 'Failed to generate response',
        details: error.message 
      });
    });
}
