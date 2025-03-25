
import { useState, useRef, useEffect } from 'react';
import { ChatMessage, chatbotService } from '@/utils/chatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatWidgetProps {
  botId?: string;
}

export const ChatWidget = ({ botId }: ChatWidgetProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'bot',
      content: 'Hello! I\'m your website assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const toggleWidget = () => {
    setIsOpen(prev => !prev);
  };
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const botResponse = await chatbotService.sendMessage(inputMessage);
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'bot',
          content: 'Sorry, there was an error processing your message.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-widget-panel animate-fade-in">
          <div className="chat-widget-header">
            <div className="flex items-center space-x-2">
              <div className="bg-primary h-8 w-8 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-medium">Website Assistant</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleWidget}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="chat-widget-body">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${
                  message.role === 'user' ? 'user-message' : 'bot-message'
                }`}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="chat-message bot-message flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-widget-footer">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-grow"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputMessage.trim() || isLoading}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
      
      <div 
        className="chat-widget-button hover-scale"
        onClick={toggleWidget}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </div>
    </div>
  );
};

export default ChatWidget;
