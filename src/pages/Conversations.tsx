
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, User, Bot, Archive } from "lucide-react";
import { toast } from "sonner";
import ConversationList from "@/components/ConversationList";
import ChatInterface from "@/components/ChatInterface";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { VerticalTabs } from "@/components/VerticalTabs";
import { useConversations, Conversation } from "@/hooks/useConversations";
import ConversationHeader from "@/components/ConversationHeader";
import SearchBar from "@/components/SearchBar";
import EmptyConversationState from "@/components/EmptyConversationState";

const Conversations = () => {
  const { botId } = useParams<{ botId: string }>();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'open' | 'my' | 'unassigned' | 'closed'>('open');
  const [botName, setBotName] = useState<string>("");
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
      <ConversationHeader botName={botName} />

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
          <div className="col-span-1 md:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <SearchBar 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
              />
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
              <EmptyConversationState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;
