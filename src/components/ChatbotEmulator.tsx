
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, MessageSquare } from "lucide-react";
import { chatbotService, ChatMessage } from "@/utils/chatbot";
import { ScrapeProgress } from "@/utils/scraper";

interface ChatbotEmulatorProps {
  botName: string;
  companyName: string;
  knowledge: ScrapeProgress;
  primaryColor?: string;
}

const ChatbotEmulator: React.FC<ChatbotEmulatorProps> = ({
  botName,
  companyName,
  knowledge,
  primaryColor = "#3b82f6",
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content: `Hi there! I'm ${botName || "Assistant"}, a chatbot for ${companyName || "this company"}. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update welcome message when bot name or company changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "bot",
        content: `Hi there! I'm ${botName || "Assistant"}, a chatbot for ${companyName || "this company"}. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
  }, [botName, companyName]);

  // Update knowledge base when it changes
  useEffect(() => {
    if (knowledge.status === "complete" && knowledge.results.length > 0) {
      // Extract content for the chatbot knowledge base
      const extractedKnowledge = knowledge.results.flatMap(result => {
        // Break content into paragraphs for more granular knowledge chunks
        const paragraphs = result.content.split('\n').filter(p => p.trim().length > 0);
        
        // Add title as a separate knowledge entry for better context
        const titleEntry = `${result.title} - ${result.url}`;
        
        return [titleEntry, ...(paragraphs.length > 0 ? paragraphs : [result.content])];
      });
      
      chatbotService.updateKnowledgeBase(extractedKnowledge);
    }
  }, [knowledge]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get bot's response
      const botResponse = await chatbotService.sendMessage(input);
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("Error getting response:", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "bot",
          content: "Sorry, I encountered an error. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert hex to RGB for background opacity
  const hexToRgb = (hex: string) => {
    // Remove the # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  };

  const headerStyle = {
    backgroundColor: primaryColor,
  };

  const buttonStyle = {
    backgroundColor: primaryColor,
  };

  const userMessageStyle = {
    backgroundColor: primaryColor,
  };

  const rgbColor = hexToRgb(primaryColor);
  const lightBgStyle = {
    backgroundColor: `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.1)`,
  };

  return (
    <div className="relative max-w-md mx-auto">
      {/* Chat header and container */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-[500px] flex flex-col">
        {/* Chat header */}
        <div className="text-white p-4 flex justify-between items-center" style={headerStyle}>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium">{botName || "AI Assistant"}</h3>
              <p className="text-xs opacity-80">{companyName || "Your Company"}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white/80 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "text-white rounded-br-none"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none"
                }`}
                style={message.role === "user" ? userMessageStyle : undefined}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-800">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 mr-2"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading} style={buttonStyle}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Chat toggle button (shown when chat is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-4 right-4 w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
          style={buttonStyle}
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default ChatbotEmulator;
