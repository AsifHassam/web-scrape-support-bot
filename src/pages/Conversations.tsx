
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Send, 
  Search, 
  Bell, 
  User, 
  UserPlus, 
  Clock, 
  MessageSquare,
  Check,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import ConversationList from "@/components/ConversationList";
import ChatInterface from "@/components/ChatInterface";
import CustomerDetails from "@/components/CustomerDetails";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

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
  const [activeTab, setActiveTab] = useState<string>("open");
  const [botName, setBotName] = useState<string>("");
  const navigate = useNavigate();
  const { playNotificationSound } = useUnreadMessages();
  
  const filterConversations = (conversations: Conversation[], tab: string) => {
    switch (tab) {
      case "open":
        return conversations.filter(conv => conv.status !== 'closed');
      case "my":
        return conversations.filter(conv => conv.status === 'human');
      case "unassigned":
        return conversations.filter(conv => conv.status === 'ai');
      case "closed":
        return conversations.filter(conv => conv.status === 'closed');
      default:
        return conversations;
    }
  };

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
    
    // Set up a channel to listen for new messages
    const channel = supabase
      .channel('conversation_updates')
      .on('broadcast', { event: 'new_message' }, (payload) => {
        if (payload.payload.botId === botId) {
          // Play notification sound for new messages
          playNotificationSound();
          toast.info("New message received", {
            description: `From: ${payload.payload.customerName}`
          });
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [botId, playNotificationSound]);

  const handleTakeoverChat = async (conversationId: string) => {
    if (!selectedConversation) return;
    
    try {
      // Update conversation status to 'human' in the database
      // In a real app, this would be an actual database update
      setSelectedConversation({
        ...selectedConversation,
        status: 'human'
      });
      
      toast.success("You've taken over the conversation");
    } catch (error) {
      console.error("Error taking over chat:", error);
      toast.error("Failed to take over chat");
    }
  };

  const handleCloseChat = async (conversationId: string) => {
    if (!selectedConversation) return;
    
    try {
      // Update conversation status to 'closed' in the database
      // In a real app, this would be an actual database update
      setSelectedConversation({
        ...selectedConversation,
        status: 'closed'
      });
      
      toast.success("Conversation closed");
    } catch (error) {
      console.error("Error closing chat:", error);
      toast.error("Failed to close conversation");
    }
  };

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
            <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
          {/* Left sidebar */}
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
            
            <Tabs defaultValue="open" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
              <div className="border-b border-gray-200 dark:border-gray-700">
                <TabsList className="h-10 w-full rounded-none">
                  <TabsTrigger value="open" className="flex-1 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">
                    Open
                    <Badge variant="outline" className="ml-1.5 h-5 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                      11
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="my" className="flex-1">My</TabsTrigger>
                  <TabsTrigger value="unassigned" className="flex-1">Unassigned</TabsTrigger>
                  <TabsTrigger value="closed" className="flex-1">Closed</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="open" className="flex-1 p-0 m-0">
                <ConversationList 
                  botId={botId || ''} 
                  filter="open"
                  onSelectConversation={setSelectedConversation}
                  selectedConversationId={selectedConversation?.id}
                />
              </TabsContent>
              
              <TabsContent value="my" className="flex-1 p-0 m-0">
                <ConversationList 
                  botId={botId || ''} 
                  filter="my"
                  onSelectConversation={setSelectedConversation}
                  selectedConversationId={selectedConversation?.id}
                />
              </TabsContent>
              
              <TabsContent value="unassigned" className="flex-1 p-0 m-0">
                <ConversationList 
                  botId={botId || ''} 
                  filter="unassigned"
                  onSelectConversation={setSelectedConversation}
                  selectedConversationId={selectedConversation?.id}
                />
              </TabsContent>
              
              <TabsContent value="closed" className="flex-1 p-0 m-0">
                <ConversationList 
                  botId={botId || ''} 
                  filter="closed"
                  onSelectConversation={setSelectedConversation}
                  selectedConversationId={selectedConversation?.id}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Middle - Chat area */}
          <div className="col-span-1 md:col-span-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
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
          
          {/* Right sidebar - Customer details */}
          <div className="col-span-1 md:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden h-full">
            {selectedConversation ? (
              <CustomerDetails conversation={selectedConversation} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    No customer selected
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a conversation to view customer details
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
