
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

interface Conversation {
  id: string;
  customer_name: string;
  status: 'ai' | 'human' | 'closed';
  customer_email?: string;
}

interface Message {
  id: string;
  role: 'user' | 'bot' | 'human';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  conversation: Conversation;
  botId: string;
  onTakeover: () => void;
  onClose: () => void;
}

// Mock messages for demo
const generateMockMessages = (conversationId: string): Message[] => {
  if (conversationId === "1") {
    return [
      {
        id: "1",
        role: "user",
        content: "Hi, I'm interested in your web development course.",
        timestamp: new Date(Date.now() - 35 * 60000)
      },
      {
        id: "2",
        role: "bot",
        content: "Hello! Thanks for your interest in our web development course. We have various programs from beginner to advanced. Could you please tell me your current experience level with coding?",
        timestamp: new Date(Date.now() - 34 * 60000)
      },
      {
        id: "3",
        role: "user",
        content: "I'm a beginner with some basic HTML and CSS knowledge.",
        timestamp: new Date(Date.now() - 33 * 60000)
      },
      {
        id: "4",
        role: "bot",
        content: "Perfect! Our 'Web Development Fundamentals' course would be a great fit for you. It covers HTML, CSS, JavaScript and introduces you to modern frameworks. Would you like more details about the curriculum, schedules or pricing?",
        timestamp: new Date(Date.now() - 32 * 60000)
      },
      {
        id: "5",
        role: "user",
        content: "Yes, could you tell me about the pricing and course duration?",
        timestamp: new Date(Date.now() - 31 * 60000)
      },
      {
        id: "6",
        role: "human",
        content: "The Web Development Fundamentals course is 12 weeks long and costs $1,200. We also offer a flexible payment plan where you can pay $450 upfront and the rest in two monthly installments. The next cohort starts on August 15th. Would you like me to reserve a spot for you?",
        timestamp: new Date(Date.now() - 30 * 60000)
      },
      {
        id: "7",
        role: "user",
        content: "Thanks for the information. I'll think about it and get back to you.",
        timestamp: new Date(Date.now() - 15 * 60000)
      },
      {
        id: "8",
        role: "human",
        content: "No problem! If you have any more questions, feel free to ask. We're also running an early bird discount of 15% off if you register within the next week.",
        timestamp: new Date(Date.now() - 14 * 60000)
      },
      {
        id: "9",
        role: "user",
        content: "Thanks",
        timestamp: new Date(Date.now() - 10 * 60000)
      }
    ];
  }
  
  if (conversationId === "2") {
    return [
      {
        id: "1",
        role: "user",
        content: "Hello, I saw your ad for web development courses",
        timestamp: new Date(Date.now() - 25 * 60000)
      },
      {
        id: "2",
        role: "bot",
        content: "Hi there! Thank you for your interest in our web development courses. We offer a variety of programs for different skill levels. Could you tell me what specific aspect of web development you're interested in?",
        timestamp: new Date(Date.now() - 24 * 60000)
      },
      {
        id: "3",
        role: "user",
        content: "I want to learn full stack development",
        timestamp: new Date(Date.now() - 23 * 60000)
      },
      {
        id: "4",
        role: "bot",
        content: "That's great! Our Full Stack Development program covers front-end technologies like HTML, CSS, JavaScript and React, as well as back-end technologies like Node.js, Express, and MongoDB. Do you have any prior experience with programming?",
        timestamp: new Date(Date.now() - 22 * 60000)
      },
      {
        id: "5",
        role: "user",
        content: "Yes I want to study web development",
        timestamp: new Date(Date.now() - 21 * 60000)
      },
      {
        id: "6",
        role: "bot",
        content: "Excellent! Our Full Stack Web Development program might be perfect for you. The course runs for 24 weeks and includes hands-on projects and career support. Would you like to know more about the curriculum, schedule options, or pricing?",
        timestamp: new Date(Date.now() - 20 * 60000)
      },
      {
        id: "7",
        role: "user",
        content: "Where you located",
        timestamp: new Date(Date.now() - 20 * 60000)
      }
    ];
  }
  
  return [
    {
      id: "1",
      role: "user",
      content: "Hello, I'm interested in your programs",
      timestamp: new Date(Date.now() - 3 * 3600000)
    },
    {
      id: "2",
      role: "bot",
      content: "Hi there! Thanks for reaching out. We offer various programs in tech education. Could you tell me what specific area you're interested in?",
      timestamp: new Date(Date.now() - 2.9 * 3600000)
    }
  ];
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  conversation, 
  botId,
  onTakeover,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // In a real app, this would fetch messages from the database
    // For demo purposes, we'll use mock data
    const mockMessages = generateMockMessages(conversation.id);
    setMessages(mockMessages);
  }, [conversation.id]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: conversation.status === 'human' ? 'human' : 'bot',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages([...messages, newMessage]);
    setInputMessage("");
    setIsLoading(true);
    
    // Simulate sending message to backend
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
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
          {messages.map((message) => (
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
                  {formatDistanceToNow(message.timestamp, { addSuffix: true })}
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
          ))}
          
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
