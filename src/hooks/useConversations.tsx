
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Conversation {
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

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'bot' | 'human';
  read: boolean;
  created_at: string;
}

export const useConversations = (botId: string, filter: 'open' | 'my' | 'unassigned' | 'closed') => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!botId) return;
    
    setLoading(true);
    
    try {
      // Fetch conversations from the database
      let query = supabase
        .from("conversations")
        .select("*, messages(content, created_at, read)")
        .eq("bot_id", botId)
        .order("updated_at", { ascending: false });
      
      // Filter based on the tab
      switch (filter) {
        case 'open':
          query = query.neq("status", "closed");
          break;
        case 'my':
          query = query.eq("status", "human");
          break;
        case 'unassigned':
          query = query.eq("status", "ai");
          break;
        case 'closed':
          query = query.eq("status", "closed");
          break;
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match the Conversation interface
      const formattedConversations: Conversation[] = data.map((conv) => {
        const messages = conv.messages || [];
        const lastMessage = messages.length > 0 ? 
          messages.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0] : null;
        
        return {
          id: conv.id,
          customer_name: conv.customer_name,
          last_message: lastMessage?.content || "No messages yet",
          last_message_time: lastMessage?.created_at || conv.created_at,
          status: conv.status as 'ai' | 'human' | 'closed',
          unread: messages.some((m: any) => !m.read && (m.role === 'user')),
          customer_email: conv.customer_email,
          customer_phone: conv.customer_phone,
          customer_location: conv.customer_location
        };
      });
      
      setConversations(formattedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [botId, filter]);

  const updateConversationStatus = async (conversationId: string, status: 'ai' | 'human' | 'closed') => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
      
      if (error) throw error;
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, status } 
            : conv
        )
      );
      
      return true;
    } catch (error) {
      console.error("Error updating conversation status:", error);
      toast.error("Failed to update conversation status");
      return false;
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .eq("read", false)
        .eq("role", "user");
      
      if (error) throw error;
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread: false } 
            : conv
        )
      );
      
      return true;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('conversation_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `bot_id=eq.${botId}`
        }, 
        () => {
          fetchConversations();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages' 
        }, 
        () => {
          fetchConversations();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [botId, filter, fetchConversations]);

  return {
    conversations,
    loading,
    updateConversationStatus,
    markMessagesAsRead,
    refreshConversations: fetchConversations
  };
};
