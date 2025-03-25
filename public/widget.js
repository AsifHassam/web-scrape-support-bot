
(function() {
  // Create and inject our stylesheet
  const style = document.createElement('style');
  style.textContent = `
    .chat-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    .chat-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: var(--chat-primary-color, #3b82f6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
    }
    
    .chat-widget-button:hover {
      transform: scale(1.05);
    }
    
    .chat-widget-panel {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .chat-widget-header {
      padding: 16px;
      background-color: var(--chat-primary-color, #3b82f6);
      color: white;
      border-bottom: 1px solid #f1f1f1;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .chat-widget-body {
      flex-grow: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .chat-widget-footer {
      padding: 16px;
      border-top: 1px solid #f1f1f1;
    }
    
    .chat-message {
      padding: 12px;
      border-radius: 16px;
      max-width: 80%;
      word-break: break-word;
    }
    
    .user-message {
      background-color: var(--chat-primary-color, #3b82f6);
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    
    .bot-message {
      background-color: #f1f3f5;
      color: #333;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }

    .chat-input-form {
      display: flex;
      gap: 8px;
    }

    .chat-input {
      flex-grow: 1;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      outline: none;
    }

    .chat-send-button {
      background-color: var(--chat-primary-color, #3b82f6);
      color: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .fade-in {
      animation: fade-in 0.3s ease;
    }
  `;
  document.head.appendChild(style);

  // Get the bot ID from the script tag
  const getCurrentScript = () => {
    // For modern browsers
    if (document.currentScript) {
      return document.currentScript;
    }
    
    // For older browsers
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      const src = script.getAttribute('src') || '';
      if (src.includes('widget.js')) {
        return script;
      }
    }
    
    return null;
  };
  
  const scriptTag = getCurrentScript();
  
  let botId = '';
  if (scriptTag) {
    botId = scriptTag.getAttribute('data-bot-id') || '';
    console.log('Bot ID extracted from script tag:', botId);
  } else {
    console.error('Could not find script tag for widget');
  }

  // Create widget container
  const container = document.createElement('div');
  container.className = 'chat-widget-container';
  document.body.appendChild(container);

  // Create initial button
  const button = document.createElement('div');
  button.className = 'chat-widget-button';
  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  container.appendChild(button);

  // Track widget state
  let isOpen = false;
  let panel = null;
  let messages = [];
  let botInfo = {
    name: 'Support Bot',
    company: 'Your Company',
    primaryColor: '#3b82f6'
  };

  // Function to fetch bot configuration from the server
  async function fetchBotConfig() {
    if (!botId) {
      console.error('No bot ID found, cannot fetch configuration');
      return;
    }
    
    try {
      const response = await fetch(`https://web-scrape-support-bot.lovable.app/api/bot-config?botId=${encodeURIComponent(botId)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.bot) {
          botInfo = {
            name: data.bot.name || 'Support Bot',
            company: data.bot.company_name || 'Your Company',
            primaryColor: data.bot.primary_color || '#3b82f6'
          };
          
          // Set CSS variable for the primary color
          document.documentElement.style.setProperty('--chat-primary-color', botInfo.primaryColor);
          
          // If the welcome message hasn't been set yet, add it
          if (messages.length === 0) {
            messages.push({
              role: 'bot',
              content: `Hello! I'm ${botInfo.name}, a chatbot for ${botInfo.company}. How can I help you today?`
            });
          }
          
          // Update UI if panel is open
          if (panel) {
            const nameElement = panel.querySelector('.bot-name');
            const companyElement = panel.querySelector('.company-name');
            
            if (nameElement) nameElement.textContent = botInfo.name;
            if (companyElement) companyElement.textContent = botInfo.company;
            
            // Re-render messages to apply any primary color changes
            renderMessages();
          }
        }
      } else {
        console.error('Failed to load bot configuration:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching bot configuration:', error);
    }
  }

  // Function to create the chat panel
  function createChatPanel() {
    panel = document.createElement('div');
    panel.className = 'chat-widget-panel fade-in';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'chat-widget-header';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 32px; height: 32px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div>
          <span class="bot-name" style="font-weight: 500;">${botInfo.name}</span>
          <div class="company-name" style="font-size: 12px; opacity: 0.8;">${botInfo.company}</div>
        </div>
      </div>
      <div style="cursor: pointer;" id="chat-widget-close">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>
    `;
    panel.appendChild(header);
    
    // Add body (message container)
    const body = document.createElement('div');
    body.className = 'chat-widget-body';
    body.id = 'chat-widget-body';
    panel.appendChild(body);
    
    // Add footer with input
    const footer = document.createElement('div');
    footer.className = 'chat-widget-footer';
    footer.innerHTML = `
      <form class="chat-input-form" id="chat-input-form">
        <input 
          type="text" 
          class="chat-input" 
          placeholder="Type your message..." 
          id="chat-input"
        />
        <button type="submit" class="chat-send-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    `;
    panel.appendChild(footer);
    
    // Add the panel to the container
    container.appendChild(panel);
    
    // Set up event listeners
    document.getElementById('chat-widget-close').addEventListener('click', toggleWidget);
    document.getElementById('chat-input-form').addEventListener('submit', handleSendMessage);
    
    // Render initial messages
    renderMessages();
  }

  // Function to render messages
  function renderMessages() {
    const body = document.getElementById('chat-widget-body');
    if (!body) return;
    
    body.innerHTML = '';
    
    if (messages.length === 0) {
      // Add default welcome message if no messages exist
      messages.push({
        role: 'bot',
        content: `Hello! I'm ${botInfo.name}, a chatbot for ${botInfo.company}. How can I help you today?`
      });
    }
    
    messages.forEach(message => {
      const messageEl = document.createElement('div');
      messageEl.className = `chat-message ${message.role === 'user' ? 'user-message' : 'bot-message'} fade-in`;
      messageEl.textContent = message.content;
      body.appendChild(messageEl);
    });
    
    // Scroll to bottom
    body.scrollTop = body.scrollHeight;
  }

  // Function to handle sending messages
  function handleSendMessage(e) {
    e.preventDefault();
    
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;
    
    const userMessage = {
      role: 'user',
      content: input.value.trim()
    };
    
    // Add user message and clear input
    messages.push(userMessage);
    input.value = '';
    renderMessages();
    
    // Check if we have a valid botId
    if (!botId) {
      messages.push({
        role: 'bot',
        content: "Sorry, I can't process your message because the bot ID is missing."
      });
      renderMessages();
      return;
    }
    
    setTimeout(() => {
      // Use the correct absolute URL to the deployed API
      const apiUrl = `https://web-scrape-support-bot.lovable.app/api/chat?botId=${encodeURIComponent(botId)}&message=${encodeURIComponent(userMessage.content)}`;
      console.log('Sending request to API:', apiUrl);
      
      // Show typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'chat-message bot-message fade-in';
      typingIndicator.id = 'typing-indicator';
      typingIndicator.innerHTML = 'Typing...';
      document.getElementById('chat-widget-body').appendChild(typingIndicator);
      
      // Generate a random session ID if one doesn't exist yet
      const sessionId = localStorage.getItem('chatSessionId') || 
                      Math.random().toString(36).substring(2, 15);
      
      // Store the session ID for future reference
      localStorage.setItem('chatSessionId', sessionId);
      
      // Make the API call with explicit content type headers and session ID
      fetch(`${apiUrl}&sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          console.log('API response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
          }

          // First get the raw text to verify what's being returned
          return response.text().then(text => {
            console.log('Raw API response text:', text);
            
            // Try to parse as JSON, but handle if it's not valid JSON
            try {
              return JSON.parse(text);
            } catch (e) {
              console.error('Failed to parse response as JSON:', e);
              throw new Error('Received invalid JSON response from server');
            }
          });
        })
        .then(data => {
          console.log('API response data:', data);
          // Remove typing indicator
          const indicator = document.getElementById('typing-indicator');
          if (indicator) indicator.remove();
          
          // Add bot response
          messages.push({
            role: 'bot',
            content: data.response || "Thanks for your message! I'll get back to you soon."
          });
          renderMessages();
        })
        .catch((error) => {
          // Log the detailed error
          console.error('API call failed:', error);
          
          // Remove typing indicator
          const indicator = document.getElementById('typing-indicator');
          if (indicator) indicator.remove();
          
          // Add fallback response
          messages.push({
            role: 'bot',
            content: "I'm having trouble connecting to my knowledge base right now. Please try again later."
          });
          renderMessages();
        });
    }, 1000);
  }

  // Function to toggle the widget
  function toggleWidget() {
    if (isOpen) {
      if (panel) {
        panel.remove();
        panel = null;
      }
    } else {
      createChatPanel();
    }
    isOpen = !isOpen;
  }

  // Add click event to the button
  button.addEventListener('click', toggleWidget);
  
  // Fetch bot configuration on initialization
  fetchBotConfig();
  
  // Debug information
  console.log('Chat widget initialized with bot ID:', botId);
})();
