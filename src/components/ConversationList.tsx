
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Conversation {
  id: string;
  customer_name: string;
  last_message: string;
  last_message_time: string;
  status: 'ai' | 'human' | 'closed';
  unread: boolean;
  customer_email?: string;
  customer_location?: string;
}

interface ConversationListProps {
  botId: string;
  filter: 'open' | 'my' | 'unassigned' | 'closed';
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

// For demo purposes, create some sample conversations
const generateMockConversations = (filter: string): Conversation[] => {
  const baseConversations = [
    {
      id: "1",
      customer_name: "Bright Mahlase",
      last_message: "Thanks",
      last_message_time: new Date(Date.now() - 10 * 60000).toISOString(),
      status: 'human' as const,
      unread: true,
      customer_email: "mahalsebright@gmail.com",
      customer_location: "Johannesburg"
    },
    {
      id: "2",
      customer_name: "S'mangaliso Ngo",
      last_message: "Where you located",
      last_message_time: new Date(Date.now() - 20 * 60000).toISOString(),
      status: 'ai' as const,
      unread: true,
      customer_email: "smangaliso@example.com",
      customer_location: "Durban"
    },
    {
      id: "3",
      customer_name: "Jeffrey Mzimba", 
      last_message: "I've been trying to apply for the course",
      last_message_time: new Date(Date.now() - 3 * 3600000).toISOString(),
      status: 'ai' as const,
      unread: false,
      customer_email: "jeffrey@example.com", 
      customer_location: "South Africa"
    },
    {
      id: "4",
      customer_name: "Aslam Seedat",
      last_message: "How much is the full stack program?",
      last_message_time: new Date(Date.now() - 5 * 3600000).toISOString(),
      status: 'human' as const,
      unread: false,
      customer_email: "aslam@example.com",
      customer_location: "Johannesburg"
    },
    {
      id: "5",
      customer_name: "Jonathan Jane",
      last_message: "Currently working as an IT technician",
      last_message_time: new Date(Date.now() - 8 * 3600000).toISOString(),
      status: 'closed' as const,
      unread: false,
      customer_email: "jonathan@example.com",
      customer_location: "Vanderkloof"
    },
  ];

  switch (filter) {
    case 'open':
      return baseConversations.filter(conv => conv.status !== 'closed');
    case 'my':
      return baseConversations.filter(conv => conv.status === 'human');
    case 'unassigned':
      return baseConversations.filter(conv => conv.status === 'ai');
    case 'closed':
      return baseConversations.filter(conv => conv.status === 'closed');
    default:
      return baseConversations;
  }
};

const ConversationList: React.FC<ConversationListProps> = ({ 
  botId, 
  filter,
  onSelectConversation,
  selectedConversationId
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would fetch from the database
        // const { data, error } = await supabase
        //   .from("conversations")
        //   .select("*")
        //   .eq("bot_id", botId)
        //   .order("last_message_time", { ascending: false });
        
        // if (error) throw error;
        
        // For demo, we'll use mock data
        const mockData = generateMockConversations(filter);
        
        // Simulate network delay
        setTimeout(() => {
          setConversations(mockData);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setLoading(false);
      }
    };

    fetchConversations();
    
    // Set up a subscription for real-time updates
    const channel = supabase
      .channel('conversation_updates')
      .on('broadcast', { event: 'conversation_updated' }, (payload) => {
        // This would update the conversation list in real-time
        // For demo purposes, we're not implementing the full real-time functionality
        console.log('Conversation updated:', payload);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [botId, filter]);

  if (loading) {
    return (
      <ScrollArea className="h-full">
        <div className="space-y-4 p-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-start space-x-4 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1">
        {conversations.length === 0 ? (
          <p className="text-center text-gray-500 p-4">No conversations found</p>
        ) : (
          conversations.map((conversation) => {
            const initials = conversation.customer_name
              .split(' ')
              .map(name => name[0])
              .join('')
              .toUpperCase();
              
            return (
              <div
                key={conversation.id}
                className={`flex items-start p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  selectedConversationId === conversation.id 
                    ? 'bg-gray-100 dark:bg-gray-700' 
                    : ''
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.unread && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.customer_name}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${
                    conversation.unread 
                      ? 'text-gray-900 dark:text-white font-medium' 
                      : 'text-gray-500 dark:text-gray-400'
                  } truncate`}>
                    {conversation.last_message}
                  </p>
                  
                  <div className="flex items-center mt-1">
                    {conversation.customer_location && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {conversation.customer_location}
                      </span>
                    )}
                    
                    {conversation.status === 'human' && (
                      <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                        Human
                      </Badge>
                    )}
                    
                    {conversation.status === 'ai' && (
                      <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        AI
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
};

export default ConversationList;
