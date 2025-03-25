
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { chatbotService } from '@/utils/chatbot';

// This is a simple API endpoint that will handle chat requests from the widget
export default function handler(req, res) {
  const { botId, message } = req.query;
  
  if (!botId || !message) {
    return res.status(400).json({ 
      error: 'Missing required parameters: botId and message are required' 
    });
  }
  
  // In a real implementation, you would:
  // 1. Query the knowledge base for this specific bot using botId
  // 2. Use that knowledge to generate a response
  // 3. Possibly log the conversation in your database
  
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
