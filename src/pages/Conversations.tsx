
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  User,
  MessageSquare,
  Bot,
  Archive
} from "lucide-react";
import { toast } from "sonner";
import ConversationList from "@/components/ConversationList";
import ChatInterface from "@/components/ChatInterface";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VerticalTabs } from "@/components/VerticalTabs";
import { useConversations } from "@/hooks/useConversations";

interface Conversation {
  id: string;
  customer_name: string;
  last_message: string;
  last_message_time: string;
  status: 'ai' | 'human' | 'closed';
  unread: boolean;
  customer_email?: string;
  customer_phone?: string;
  customer_location?: string;
}

const Conversations = () => {
  const { botId } = useParams<{ botId: string }>();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'open' | 'my' | 'unassigned' | 'closed'>('open');
  const [botName, setBotName] = useState<string>("");
  const navigate = useNavigate();
  const { playNotificationSound } = useUnreadMessages();
  
  // Get conversation counts for each tab
  const { 
    conversations: openConversations,
    updateConversationStatus,
    refreshConversations
  } = useConversations(botId || '', 'open');
  
  const { conversations: myConversations } = useConversations(botId || '', 'my');
  const { conversations: unassignedConversations } = useConversations(botId || '', 'unassigned');
  const { conversations: closedConversations } = useConversations(botId || '', 'closed');

  useEffect(() => {
    const fetchBotDetails = async () => {
      if (!botId) return;
      
      try {
        const { data, error } = await supabase
          .from("bots")
          .select("name")
          .eq("id", botId)
          .single();
          
        if (error) throw error;
        setBotName(data?.name || "Chat Bot");
      } catch (error) {
        console.error("Error fetching bot details:", error);
        toast.error("Failed to load bot information");
      }
    };
    
    fetchBotDetails();
    
    const channel = supabase
      .channel('conversation_updates')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: botId ? `conversation_id=eq.${botId}` : undefined
        }, 
        (payload) => {
          playNotificationSound();
          toast.info("New message received", {
            description: `From: ${payload.new.content.substring(0, 30)}...`
          });
          refreshConversations();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [botId, playNotificationSound, refreshConversations]);

  const handleTakeoverChat = async (conversationId: string) => {
    if (!selectedConversation) return;
    
    try {
      const success = await updateConversationStatus(conversationId, 'human');
      
      if (success) {
        setSelectedConversation({
          ...selectedConversation,
          status: 'human'
        });
        
        toast.success("You've taken over the conversation");
      }
    } catch (error) {
      console.error("Error taking over chat:", error);
      toast.error("Failed to take over chat");
    }
  };

  const handleCloseChat = async (conversationId: string) => {
    if (!selectedConversation) return;
    
    try {
      const success = await updateConversationStatus(conversationId, 'closed');
      
      if (success) {
        setSelectedConversation({
          ...selectedConversation,
          status: 'closed'
        });
        
        toast.success("Conversation closed");
      }
    } catch (error) {
      console.error("Error closing chat:", error);
      toast.error("Failed to close conversation");
    }
  };

  // Calculate unread counts
  const unreadOpenCount = openConversations.filter(conv => conv.unread).length;
  const unreadMyCount = myConversations.filter(conv => conv.unread).length;
  const unreadUnassignedCount = unassignedConversations.filter(conv => conv.unread).length;

  const tabs = [
    {
      value: "open",
      label: "All Open",
      icon: <MessageSquare className="h-4 w-4" />,
      count: unreadOpenCount > 0 ? unreadOpenCount : undefined
    },
    {
      value: "my",
      label: "My Chats",
      icon: <User className="h-4 w-4" />,
      count: unreadMyCount > 0 ? unreadMyCount : undefined
    },
    {
      value: "unassigned",
      label: "Unassigned",
      icon: <Bot className="h-4 w-4" />,
      count: unreadUnassignedCount > 0 ? unreadUnassignedCount : undefined
    },
    {
      value: "closed",
      label: "Closed",
      icon: <Archive className="h-4 w-4" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {botName} - Conversations
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
          <div className="col-span-1 md:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <VerticalTabs 
                defaultValue="open"
                tabs={tabs}
                onValueChange={(value) => setActiveTab(value as 'open' | 'my' | 'unassigned' | 'closed')}
              />
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ConversationList 
                botId={botId || ''} 
                filter={activeTab}
                onSelectConversation={setSelectedConversation}
                selectedConversationId={selectedConversation?.id}
              />
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-9 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
            {selectedConversation ? (
              <ChatInterface 
                conversation={selectedConversation}
                botId={botId || ''}
                onTakeover={() => handleTakeoverChat(selectedConversation.id)}
                onClose={() => handleCloseChat(selectedConversation.id)}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    No conversation selected
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a conversation from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;
