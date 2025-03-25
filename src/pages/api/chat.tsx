
import { NextApiRequest, NextApiResponse } from 'next';
import { chatbotService } from '@/utils/chatbot';

// This is an API endpoint that will handle chat requests from the widget
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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
}
