
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';

const EmbeddableWidget = () => {
  const [botId, setBotId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Find the script tag by looking for widget.js in the src attribute
    const findScriptTag = () => {
      const scripts = document.querySelectorAll('script');
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const src = script.getAttribute('src') || '';
        if (src.includes('widget.js')) {
          return script;
        }
      }
      return null;
    };
    
    // Extract the botId from the script tag's data attribute
    const scriptTag = findScriptTag();
    
    if (scriptTag) {
      const dataBot = scriptTag.getAttribute('data-bot-id');
      if (dataBot) {
        console.log('Bot ID found:', dataBot);
        setBotId(dataBot);
      } else {
        console.error('No bot ID found in script tag');
        setError('Missing data-bot-id attribute in script tag');
      }
    } else {
      console.error('Could not find script tag with widget.js');
      setError('Could not find the widget script tag');
    }
  }, []);
  
  // If there's an error, show it
  if (error) {
    return (
      <div className="chat-widget-container">
        <div className="chat-widget-button" style={{ backgroundColor: '#f44336' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
      </div>
    );
  }
  
  // Only render the ChatWidget if we have a botId
  return botId ? (
    <ChatWidget botId={botId} />
  ) : (
    <div className="chat-widget-container">
      <div className="chat-widget-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      </div>
    </div>
  );
};

// Create a function to inject and initialize the widget
function injectChatWidget() {
  // Check if widget container already exists to prevent duplicates
  if (document.getElementById('support-bot-widget-container')) {
    console.log('Widget container already exists');
    return;
  }
  
  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'support-bot-widget-container';
  document.body.appendChild(widgetContainer);

  try {
    // Mount the React component to the container
    const root = createRoot(widgetContainer);
    root.render(<EmbeddableWidget />);
    console.log('Chat widget injected successfully');
  } catch (error) {
    console.error('Failed to inject chat widget:', error);
  }
}

// Make sure the DOM is fully loaded before injecting
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(injectChatWidget, 100); // Short delay to ensure DOM is ready
} else {
  window.addEventListener('load', injectChatWidget);
}

export default EmbeddableWidget;
