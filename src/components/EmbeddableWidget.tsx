
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';

const EmbeddableWidget = () => {
  const [botId, setBotId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Extract the botId from the script tag's data attribute
    const scriptTag = document.currentScript || 
      document.querySelector('script[src*="widget-script.js"]') || 
      document.querySelector('script[src*="embedWidget"]');
    
    if (scriptTag) {
      const dataBot = scriptTag.getAttribute('data-bot-id');
      if (dataBot) {
        console.log('Bot ID found:', dataBot);
        setBotId(dataBot);
      } else {
        console.error('No bot ID found in script tag');
      }
    } else {
      console.error('Could not find script tag');
    }
  }, []);
  
  // Only render the ChatWidget if we have a botId
  return botId ? <ChatWidget botId={botId} /> : null;
};

// Create a function to inject and initialize the widget
function injectChatWidget() {
  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'support-bot-widget-container';
  document.body.appendChild(widgetContainer);

  // Mount the React component to the container
  const root = createRoot(widgetContainer);
  root.render(<EmbeddableWidget />);
}

// Make sure the DOM is fully loaded before injecting
if (document.readyState === 'complete') {
  injectChatWidget();
} else {
  window.addEventListener('load', injectChatWidget);
}

export default EmbeddableWidget;
