
import { supabase } from '@/integrations/supabase/client';

// API endpoint to fetch bot configuration
export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { botId } = req.query;
  
  if (!botId) {
    return res.status(400).json({ 
      error: 'Missing required parameter: botId is required' 
    });
  }
  
  console.log('Fetching configuration for bot ID:', botId);
  
  try {
    // Fetch bot details from Supabase
    const { data: bot, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();
    
    if (error) {
      console.error('Error fetching bot configuration:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch bot configuration', 
        details: error.message 
      });
    }
    
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    // Return the bot configuration
    return res.status(200).json({ bot });
  } catch (error) {
    console.error('Unexpected error fetching bot configuration:', error);
    return res.status(500).json({ 
      error: 'Unexpected error occurred', 
      details: error.message 
    });
  }
}
