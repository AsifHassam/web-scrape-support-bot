
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserLocation } from "@/services/locationService";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot' | 'human';
  read: boolean;
  created_at: string;
}

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || []);
      
      // Mark messages as read
      const unreadMessages = data?.filter(msg => !msg.read && msg.role === 'user') || [];
      if (unreadMessages.length > 0) {
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", conversationId)
          .eq("read", false)
          .eq("role", "user");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = async (content: string, role: 'user' | 'bot' | 'human') => {
    if (!conversationId || !content.trim()) return null;
    
    try {
      const newMessage = {
        conversation_id: conversationId,
        content,
        role,
        read: role !== 'user', // Mark as read if it's not from the user
      };
      
      const { data, error } = await supabase
        .from("messages")
        .insert(newMessage)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update conversation's last update time
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
      
      // Add message to state
      setMessages(prev => [...prev, data]);
      
      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return null;
    }
  };

  const createNewConversation = async (botId: string, customerName: string, initialMessage: string) => {
    try {
      // Get user location
      const locationData = await getUserLocation();
      const locationString = locationData.city && locationData.country
        ? `${locationData.city}, ${locationData.country}`
        : undefined;
      
      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          bot_id: botId,
          customer_name: customerName,
          customer_location: locationString
        })
        .select()
        .single();
      
      if (convError) throw convError;
      
      // Create initial message
      const { data: message, error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          content: initialMessage,
          role: 'user',
          read: false
        })
        .select()
        .single();
      
      if (msgError) throw msgError;
      
      return { conversation, message };
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
      return null;
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('messages_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined
        }, 
        () => {
          fetchMessages();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    createNewConversation,
    refreshMessages: fetchMessages
  };
};
