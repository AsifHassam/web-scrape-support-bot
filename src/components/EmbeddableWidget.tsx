
import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';

const EmbeddableWidget = () => {
  return <ChatWidget />;
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
