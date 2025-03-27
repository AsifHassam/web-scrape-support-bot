import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { chatbotService } from './utils/chatbot';
import { supabase } from '@/integrations/supabase/client';

// Make sure the root element exists before trying to render
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found - could not mount React application");
}

// Set production URL for Supabase redirects
if (typeof window !== 'undefined') {
  const SITE_URL = 'https://web-scrape-support-bot.lovable.app';
  supabase.auth.setConfig({
    url: SITE_URL,
    redirectTo: `${SITE_URL}/auth`,
  });

  // Handle API requests if running in a browser environment
  // Store visitor sessions to track unique visitors
  const visitorSessions = new Map<string, boolean>();
  
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
      const sessionId = urlObj.searchParams.get('sessionId') || 
                        localStorage.getItem('chatSessionId') || 
                        Math.random().toString(36).substring(2, 15);
      
      // Store the session ID for future reference
      localStorage.setItem('chatSessionId', sessionId);
      
      // Determine if this is a new visitor
      const isNewVisitor = !visitorSessions.has(sessionId);
      if (isNewVisitor) {
        visitorSessions.set(sessionId, true);
      }
      
      if (!botId || !message) {
        console.error('Missing parameters in API call:', { botId, message });
        return new Response(JSON.stringify({ 
          error: 'Missing required parameters: botId and message are required' 
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }
      
      try {
        // Update analytics
        try {
          const analyticsResponse = await fetch(
            `https://qbhevelbszcvxkutfmlg.supabase.co/functions/v1/update-analytics`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                botId,
                sessionId,
                isNewVisitor
              })
            }
          );
          
          if (!analyticsResponse.ok) {
            console.error('Failed to update analytics:', await analyticsResponse.text());
          }
        } catch (analyticsError) {
          console.error('Error updating analytics:', analyticsError);
        }
        
        // Use the chatbot service for message processing
        console.log('Processing message with chatbot service:', message);
        const response = await chatbotService.sendMessage(message);
        console.log('Chatbot service response:', response);
        
        // Return JSON response with proper CORS headers
        return new Response(JSON.stringify({ response: response.content }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      } catch (error: any) {
        console.error('Error generating response:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to generate response',
          details: error.message 
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        });
      }
    }
    
    // For all other requests, pass through to the original fetch
    return originalFetch.apply(window, [input, init]);
  };
}
