import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, User, MessageSquare, Users } from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import SubscriptionStats from "@/components/SubscriptionStats";
import { SubscriptionTier } from "@/lib/types/billing";
import BotStatusToggle from "@/components/BotStatusToggle";

interface Bot {
  id: string;
  name: string;
  company: string;
  created_at: string;
  bot_type?: string;
  active_conversations?: number;
  is_live?: boolean;
}

interface UserProfile {
  id: string;
  payment_status: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [teamMemberCount, setTeamMemberCount] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalConversations, setTotalConversations] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const getSubscriptionTier = (): SubscriptionTier => {
    if (!userProfile) return 'FREE';
    
    const status = userProfile.payment_status.toUpperCase();
    if (status === 'PAID' || status === 'PRO') return 'PRO';
    if (status === 'STARTER') return 'STARTER';
    if (status === 'ENTERPRISE') return 'ENTERPRISE';
    return 'FREE';
  };

  useEffect(() => {
    const fetchBotsAndConversations = async () => {
      try {
        if (!user) {
          console.log("No user found, skipping fetch");
          setLoading(false);
          return;
        }
        
        const { data: profileData, error: profileError } = await supabase
          .from("users_metadata")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          if (profileError.code === 'PGRST116') {
            const { data: newProfile, error: insertError } = await supabase
              .from("users_metadata")
              .insert([{ id: user.id, payment_status: 'FREE' }])
              .select()
              .single();
            
            if (insertError) {
              throw insertError;
            }
            
            setUserProfile(newProfile as UserProfile);
          } else {
            throw profileError;
          }
        } else {
          setUserProfile(profileData as UserProfile);
        }
        
        const { data: botsData, error: botsError } = await supabase
          .from("bots")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (botsError) {
          console.error("Error fetching bots:", botsError);
          throw botsError;
        }
        
        const botsWithCounts = await Promise.all((botsData || []).map(async (bot) => {
          try {
            const { count, error: countError } = await supabase
              .from("conversations")
              .select("*", { count: 'exact', head: true })
              .eq("bot_id", bot.id)
              .neq("status", "closed");
            
            if (countError) {
              console.error("Error fetching conversation count:", countError);
              return { ...bot, active_conversations: 0, is_live: Math.random() > 0.5 };
            }
            
            return { ...bot, active_conversations: count || 0, is_live: Math.random() > 0.5 };
          } catch (error) {
            console.error("Error processing bot data:", error);
            return { ...bot, active_conversations: 0, is_live: false };
          }
        }));
        
        setBots(botsWithCounts);
        
        const { count: messageCount, error: messageError } = await supabase
          .from("messages")
          .select("*", { count: 'exact', head: true });
        
        if (!messageError) {
          setTotalMessages(messageCount || 0);
        } else {
          console.error("Error fetching message count:", messageError);
        }
        
        const { count: conversationCount, error: conversationError } = await supabase
          .from("conversations")
          .select("*", { count: 'exact', head: true });
        
        if (!conversationError) {
          setTotalConversations(conversationCount || 0);
        } else {
          console.error("Error fetching conversation count:", conversationError);
        }
        
        setTeamMemberCount(1);
        
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching data: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBotsAndConversations();
  }, [user]);

  const handleCreateBot = () => {
    navigate("/create-bot");
  };

  const handleEditBot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit-bot/${id}`);
  };
  
  const handleViewConversations = (id: string) => {
    navigate(`/conversations/${id}`);
  };

  const openDeleteConfirmation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingBotId(id);
    setConfirmDialogOpen(true);
  };

  const handleDeleteBot = async () => {
    if (!deletingBotId) return;
    
    try {
      const { error: knowledgeSourcesError } = await supabase
        .from("knowledge_sources")
        .delete()
        .eq("bot_id", deletingBotId);
      
      if (knowledgeSourcesError) {
        console.error("Error deleting knowledge sources:", knowledgeSourcesError);
      }
      
      const { error: botError } = await supabase
        .from("bots")
        .delete()
        .eq("id", deletingBotId);

      if (botError) throw botError;
      
      setBots(bots.filter((bot) => bot.id !== deletingBotId));
      toast.success("Bot deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Error deleting bot: " + error.message);
    } finally {
      setDeletingBotId(null);
      setConfirmDialogOpen(false);
    }
  };

  const handleBotStatusChange = (botId: string, isLive: boolean) => {
    setBots(prevBots => 
      prevBots.map(bot => 
        bot.id === botId ? { ...bot, is_live: isLive } : bot
      )
    );
  };

  const formatBotType = (type?: string) => {
    if (!type) return "";
    
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const liveBots = bots.filter(bot => bot.is_live).length;
  const subscriptionTier = getSubscriptionTier();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Your Chatbots
              </h2>
              <Button onClick={handleCreateBot}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Bot
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            ) : bots.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No bots yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first chatbot to get started
                </p>
                <Button onClick={handleCreateBot}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Bot
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {bots.map((bot) => (
                  <div
                    key={bot.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewConversations(bot.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {bot.name}
                      </h3>
                      <div className="flex space-x-2">
                        <BotStatusToggle
                          botId={bot.id}
                          isLive={bot.is_live || false}
                          userSubscription={subscriptionTier}
                          liveBotCount={liveBots}
                          onStatusChange={(isLive) => handleBotStatusChange(bot.id, isLive)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {bot.company}
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MessageSquare className="h-4 w-4 mr-1.5" />
                        <span>{bot.active_conversations || 0} Active conversation{bot.active_conversations !== 1 ? 's' : ''}</span>
                      </div>
                      
                      {bot.bot_type && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                          {formatBotType(bot.bot_type)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleEditBot(bot.id, e)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => openDeleteConfirmation(bot.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Subscription Usage
              </h2>
              <SubscriptionStats 
                tier={subscriptionTier}
                messageCount={totalMessages}
                conversationCount={totalConversations}
                botCount={liveBots}
                teamMemberCount={teamMemberCount}
              />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Team
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {subscriptionTier === 'PRO' || subscriptionTier === 'ENTERPRISE' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage your team members and their access
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/team")}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Team
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Upgrade to Pro to add team members and manage access
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/pricing")}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Upgrade to Add Team Members
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bot</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bot? This action cannot be undone and will also 
              delete all associated knowledge sources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBot}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
