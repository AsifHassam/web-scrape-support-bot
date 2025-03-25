
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { chatbotService } from './utils/chatbot';

// Make sure the root element exists before trying to render
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found - could not mount React application");
}

// Handle API requests if running in a browser environment
if (typeof window !== 'undefined') {
  // Create a handler for the /api/chat route
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    const url = input instanceof Request ? input.url : input.toString();
    
    if (url.includes('/api/chat')) {
      console.log('Intercepting API call to:', url);
      
      // Extract query parameters
      const urlObj = new URL(url);
      const botId = urlObj.searchParams.get('botId');
      const message = urlObj.searchParams.get('message');
      
      if (!botId || !message) {
        console.error('Missing parameters in API call:', { botId, message });
        return new Response(JSON.stringify({ 
          error: 'Missing required parameters: botId and message are required' 
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      try {
        // Use the chatbot service
        console.log('Processing message with chatbot service:', message);
        const response = await chatbotService.sendMessage(message);
        console.log('Chatbot service response:', response);
        
        return new Response(JSON.stringify({ response: response.content }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      } catch (error) {
        console.error('Error generating response:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to generate response',
          details: error.message 
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // For all other requests, pass through to the original fetch
    return originalFetch.apply(window, [input, init]);
  };
}
