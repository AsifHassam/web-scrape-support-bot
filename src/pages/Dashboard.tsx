
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Bot {
  id: string;
  name: string;
  company: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const { data, error } = await supabase
          .from("bots")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBots(data || []);
      } catch (error: any) {
        toast.error("Error fetching bots: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBots();
  }, []);

  const handleCreateBot = () => {
    navigate("/create-bot");
  };

  const handleEditBot = (id: string) => {
    navigate(`/edit-bot/${id}`);
  };

  const handleDeleteBot = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this bot?")) {
      try {
        const { error } = await supabase
          .from("bots")
          .delete()
          .eq("id", id);

        if (error) throw error;
        setBots(bots.filter((bot) => bot.id !== id));
        toast.success("Bot deleted successfully");
      } catch (error: any) {
        toast.error("Error deleting bot: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user?.email}
            </span>
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  {bot.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {bot.company}
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditBot(bot.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBot(bot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
