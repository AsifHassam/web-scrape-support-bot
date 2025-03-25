
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
      background-color: #3b82f6;
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
      background-color: #3b82f6;
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
      background-color: #3b82f6;
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

  // Get the bot ID from the script
  let botId = '';
  if (window.__supportBot && window.__supportBot.botId) {
    botId = window.__supportBot.botId;
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
  let messages = [
    {
      role: 'bot',
      content: 'Hello! How can I help you today?'
    }
  ];

  // Function to create the chat panel
  function createChatPanel() {
    panel = document.createElement('div');
    panel.className = 'chat-widget-panel fade-in';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'chat-widget-header';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 32px; height: 32px; background-color: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <span style="font-weight: 500;">Support Bot</span>
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
    
    // Simulate API call to get bot response
    setTimeout(() => {
      // This would be replaced with a real API call to your backend
      // using the botId to get the response
      const apiUrl = `https://7e6a573a-460b-43a5-9cdd-5d5f597b90e0.lovableproject.com/api/chat?botId=${botId}&message=${encodeURIComponent(userMessage.content)}`;
      
      // Show typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'chat-message bot-message fade-in';
      typingIndicator.id = 'typing-indicator';
      typingIndicator.innerHTML = 'Typing...';
      document.getElementById('chat-widget-body').appendChild(typingIndicator);
      
      // Make the real API call
      fetch(apiUrl)
        .then(response => response.json())
        .catch(() => {
          // Fallback response if API call fails
          return { response: "I'm having trouble connecting to my knowledge base right now. Please try again later." };
        })
        .then(data => {
          // Remove typing indicator
          const indicator = document.getElementById('typing-indicator');
          if (indicator) indicator.remove();
          
          // Add bot response
          messages.push({
            role: 'bot',
            content: data.response || "Thanks for your message! I'll get back to you soon."
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
})();
