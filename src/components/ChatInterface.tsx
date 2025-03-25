
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { 
  Send, 
  User, 
  Bot, 
  UserPlus, 
  X,
  MessageSquare 
} from "lucide-react";
import { useMessages } from "@/hooks/useMessages";

interface Conversation {
  id: string;
  customer_name: string;
  status: 'ai' | 'human' | 'closed';
  customer_email?: string;
}

interface ChatInterfaceProps {
  conversation: Conversation;
  botId: string;
  onTakeover: () => void;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  conversation, 
  botId,
  onTakeover,
  onClose
}) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage } = useMessages(conversation.id);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Send message from agent (human or bot depending on conversation status)
      const role = conversation.status === 'human' ? 'human' : 'bot';
      await sendMessage(inputMessage, role);
      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback className="bg-primary/10 text-primary">
              {conversation.customer_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{conversation.customer_name}</h3>
            <p className="text-xs text-gray-500">
              {conversation.customer_email || 'No email provided'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {conversation.status === 'ai' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onTakeover}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Take over
            </Button>
          )}
          
          {conversation.status !== 'closed' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
              className="text-gray-600 border-gray-200"
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center">
              <div className="loading">Loading messages...</div>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role !== 'user' && (
                  <Avatar className="h-8 w-8 mt-1 mr-2">
                    {message.role === 'bot' ? (
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                )}
                
                <div 
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-none ml-auto' 
                      : message.role === 'bot'
                        ? 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 rounded-bl-none'
                        : 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="mt-1 text-xs opacity-70 text-right">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 mt-1 ml-2">
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <Avatar className="h-8 w-8 mt-1 mr-2">
                {conversation.status === 'human' ? (
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        {conversation.status === 'closed' ? (
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This conversation has been closed
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!inputMessage.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </>
  );
};

export default ChatInterface;
