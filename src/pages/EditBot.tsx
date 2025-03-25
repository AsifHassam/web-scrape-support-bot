
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BotAnalytics from "@/components/BotAnalytics";
import KnowledgeBaseManager from "@/components/KnowledgeBaseManager";
import { toast } from "@/components/ui/use-toast";

const EditBot = () => {
  const [bot, setBot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBot = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("bots")
          .select("*")
          .eq("id", id)
          .single();
          
        if (error) throw error;
        setBot(data);
      } catch (error: any) {
        console.error("Error fetching bot:", error);
        toast({
          title: "Error",
          description: "Failed to load bot information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBot();
  }, [id]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        ) : !bot ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bot not found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The bot you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{bot.name}</h1>
            </div>
            
            <Tabs defaultValue="analytics" className="space-y-6">
              <TabsList className="w-full md:w-auto mb-6">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                <TabsTrigger value="styling">Styling</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analytics" className="space-y-6">
                <BotAnalytics botId={id!} />
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Bot Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Settings content will appear here.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="knowledge">
                <KnowledgeBaseManager botId={id!} />
              </TabsContent>
              
              <TabsContent value="styling">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Styling Options</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Styling options will appear here.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditBot;
