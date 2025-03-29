import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, MoreHorizontal, FileEdit, Trash2, MessageSquare, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BotStatusToggle from "@/components/BotStatusToggle";
import { SubscriptionTier } from "@/lib/types/billing";

interface Bot {
  id: string;
  name: string;
  company: string | null;
  bot_type: string | null;
  is_live: boolean;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isTeamAdmin, setIsTeamAdmin] = useState(false);
  const [userSubscription, setUserSubscription] = useState<SubscriptionTier>("STARTER");
  const [liveBotCount, setLiveBotCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchBots();
      checkUserStatus();
    }
  }, [user]);

  const checkUserStatus = async () => {
    try {
      // Check if user is on PRO or ENTERPRISE plan
      const { data: userData, error: userError } = await supabase
        .from('users_metadata')
        .select('payment_status')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      const subscriptionTier = userData?.payment_status as SubscriptionTier || "STARTER";
      setUserSubscription(subscriptionTier);
      const premiumUser = subscriptionTier === 'PRO' || subscriptionTier === 'ENTERPRISE';
      setIsPremiumUser(premiumUser);
      
      if (premiumUser) {
        // Check if user is a team admin
        const { data: isAdminData, error: isAdminError } = await supabase
          .rpc('is_team_admin', { user_id: user?.id });

        if (isAdminError) throw isAdminError;
        
        setIsTeamAdmin(isAdminData);
      }
    } catch (error: any) {
      console.error("Error checking user status:", error);
    }
  };

  const fetchBots = async () => {
    setLoading(true);
    try {
      let { data, error } = await supabase
        .from("bots")
        .select("id, name, company, bot_type, is_live, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        setBots(data);
        // Count live bots
        const liveBots = data.filter(bot => bot.is_live).length;
        setLiveBotCount(liveBots);
      }
    } catch (error: any) {
      console.error("Error fetching bots:", error);
      toast.error("Failed to load bots");
    } finally {
      setLoading(false);
    }
  };

  const deleteBot = async (id: string) => {
    try {
      // First check if there are any conversations or knowledge sources
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("bot_id", id);

      if (convError) throw convError;

      const { data: knowledge, error: knowError } = await supabase
        .from("knowledge_sources")
        .select("id")
        .eq("bot_id", id);

      if (knowError) throw knowError;

      // Delete related conversations first (to avoid foreign key constraint issues)
      if (conversations && conversations.length > 0) {
        for (const conv of conversations) {
          // Delete messages first
          const { error: msgError } = await supabase
            .from("messages")
            .delete()
            .eq("conversation_id", conv.id);

          if (msgError) throw msgError;
        }

        // Then delete conversations
        const { error: delConvError } = await supabase
          .from("conversations")
          .delete()
          .eq("bot_id", id);

        if (delConvError) throw delConvError;
      }

      // Delete knowledge sources
      if (knowledge && knowledge.length > 0) {
        const { error: delKnowError } = await supabase
          .from("knowledge_sources")
          .delete()
          .eq("bot_id", id);

        if (delKnowError) throw delKnowError;
      }

      // Delete bot permissions
      const { error: permError } = await supabase
        .from("bot_permissions")
        .delete()
        .eq("bot_id", id);

      if (permError) throw permError;

      // Finally delete the bot
      const { error: botError } = await supabase
        .from("bots")
        .delete()
        .eq("id", id);

      if (botError) throw botError;

      setBots((prevBots) => prevBots.filter((bot) => bot.id !== id));
      toast.success("Bot deleted successfully");
    } catch (error: any) {
      console.error("Error deleting bot:", error);
      toast.error("Failed to delete bot");
    }
  };

  const handleToggleLiveStatus = async (botId: string, isLive: boolean) => {
    try {
      const { error } = await supabase
        .from("bots")
        .update({ is_live: isLive })
        .eq("id", botId);

      if (error) throw error;

      // Update local state for bots and update live bot count
      setBots((prevBots) => {
        const updatedBots = prevBots.map((bot) =>
          bot.id === botId ? { ...bot, is_live: isLive } : bot
        );
        
        // Update live bot count
        const newLiveBotCount = updatedBots.filter(bot => bot.is_live).length;
        setLiveBotCount(newLiveBotCount);
        
        return updatedBots;
      });

      toast.success(`Bot ${isLive ? "activated" : "deactivated"} successfully`);
    } catch (error: any) {
      console.error("Error toggling bot status:", error);
      toast.error("Failed to update bot status");
    }
  };

  const filteredBots = bots.filter((bot) =>
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bot.company && bot.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Bots</h1>
          <Button onClick={() => navigate("/create-bot")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Bot
          </Button>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <Input
            className="max-w-xs"
            placeholder="Search bots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {isPremiumUser && (
            <Button variant="outline" asChild>
              <Link to="/team">
                <Users className="h-4 w-4 mr-2" />
                Manage Team
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredBots.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBots.map((bot) => (
              <Card key={bot.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl truncate mr-4">{bot.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mt-1">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/edit-bot/${bot.id}`)}>
                          <FileEdit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/conversations/${bot.id}`)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Conversations
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteBot(bot.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription>
                    {bot.company || "No company specified"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>Type: {bot.bot_type || "General"}</p>
                    <p>Created: {new Date(bot.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => navigate(`/edit-bot/${bot.id}`)}>
                    Configure
                  </Button>
                  <BotStatusToggle 
                    isLive={bot.is_live} 
                    onStatusChange={(isLive) => handleToggleLiveStatus(bot.id, isLive)}
                    botId={bot.id}
                    userSubscription={userSubscription}
                    liveBotCount={liveBotCount}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No bots found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm ? "No bots match your search" : "Create your first bot to get started"}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate("/create-bot")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Bot
              </Button>
            )}
          </div>
        )}

        {/* Team Management Call-to-Action for Premium Users */}
        {isPremiumUser && isTeamAdmin && filteredBots.length > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950">
            <CardHeader>
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Share your bots with team members and collaborate together
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                As a PRO or ENTERPRISE user, you can invite team members to access and manage selected bots.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link to="/team">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
