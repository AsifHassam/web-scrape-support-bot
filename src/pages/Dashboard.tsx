
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, User, MessageSquare } from "lucide-react";
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

interface Bot {
  id: string;
  name: string;
  company: string;
  created_at: string;
  bot_type?: string;
  active_conversations?: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBotsAndConversations = async () => {
      try {
        // Fetch bots
        const { data: botsData, error: botsError } = await supabase
          .from("bots")
          .select("*")
          .order("created_at", { ascending: false });

        if (botsError) throw botsError;
        
        // Get active conversations count for each bot
        const botsWithCounts = await Promise.all((botsData || []).map(async (bot) => {
          // Query conversations that are not closed
          const { count, error: countError } = await supabase
            .from("conversations")
            .select("*", { count: 'exact', head: true })
            .eq("bot_id", bot.id)
            .neq("status", "closed");
          
          if (countError) {
            console.error("Error fetching conversation count:", countError);
            return { ...bot, active_conversations: 0 };
          }
          
          return { ...bot, active_conversations: count || 0 };
        }));
        
        setBots(botsWithCounts);
      } catch (error: any) {
        toast.error("Error fetching bots: " + error.message);
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBotsAndConversations();
  }, []);

  const handleCreateBot = () => {
    navigate("/create-bot");
  };

  const handleEditBot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    navigate(`/edit-bot/${id}`);
  };
  
  const handleViewConversations = (id: string) => {
    navigate(`/conversations/${id}`);
  };

  const openDeleteConfirmation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setDeletingBotId(id);
    setConfirmDialogOpen(true);
  };

  const handleDeleteBot = async () => {
    if (!deletingBotId) return;
    
    try {
      const { error } = await supabase
        .from("bots")
        .delete()
        .eq("id", deletingBotId);

      if (error) throw error;
      setBots(bots.filter((bot) => bot.id !== deletingBotId));
      toast.success("Bot deleted successfully");
    } catch (error: any) {
      toast.error("Error deleting bot: " + error.message);
      console.error("Delete error:", error);
    } finally {
      setDeletingBotId(null);
      setConfirmDialogOpen(false);
    }
  };

  // Helper function to format bot type for display
  const formatBotType = (type?: string) => {
    if (!type) return "";
    
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                    Online
                  </Badge>
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
