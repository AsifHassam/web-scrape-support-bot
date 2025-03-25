
import { chatbotService } from '../utils/chatbot';

// This is the API handler for chat requests
export async function handleChatRequest(request: Request): Promise<Response> {
  // Parse the URL to get query parameters
  const url = new URL(request.url);
  const botId = url.searchParams.get('botId');
  const message = url.searchParams.get('message');
  
  // Set CORS headers
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  
  // Handle OPTIONS requests (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  
  // Validate required parameters
  if (!botId || !message) {
    return new Response(
      JSON.stringify({ 
        error: 'Missing required parameters: botId and message are required' 
      }),
      { status: 400, headers }
    );
  }
  
  try {
    // Use the chatbot service to generate a response
    const response = await chatbotService.sendMessage(message);
    
    // Return the response
    return new Response(
      JSON.stringify({ response: response.content }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error generating response:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    );
  }
}
