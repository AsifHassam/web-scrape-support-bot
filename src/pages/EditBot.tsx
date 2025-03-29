import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BotAnalytics from "@/components/BotAnalytics";
import KnowledgeBaseManager from "@/components/KnowledgeBaseManager";
import KnowledgeBase from "@/components/KnowledgeBase";
import { toast } from "@/components/ui/use-toast";
import { chatbotService } from "@/utils/chatbot";
import { scrapeWebsite } from "@/utils/scraper";
import { generateEmbedCode } from "@/utils/generateEmbedCode";
import ChatbotEmulator from "@/components/ChatbotEmulator";
import ChatbotStylingForm from "@/components/ChatbotStylingForm";
import BotStatusToggle from "@/components/BotStatusToggle";
import { SubscriptionTier } from "@/lib/types/billing";

const EditBot = () => {
  const [bot, setBot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [knowledgeBaseData, setKnowledgeBaseData] = useState<any>(null);
  const [botColor, setBotColor] = useState("#3b82f6"); // Default color
  const [botName, setBotName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [liveBotCount, setLiveBotCount] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('TRIAL');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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
        setBotName(data.name || "AI Assistant");
        setCompanyName(data.company || "Your Company");
        setIsLive(data.is_live || false);
        
        // Since primary_color is not in the database schema yet, we'll just use our default state value
        // If we later add this column to the database, we can update this code
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
    
    const fetchUserSubscription = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("users_metadata")
          .select("payment_status")
          .eq("id", user.id)
          .single();
          
        if (error) throw error;
        
        const status = data?.payment_status?.toUpperCase() || 'TRIAL';
        if (status === 'PAID' || status === 'PRO') setSubscriptionTier('PRO');
        else if (status === 'STARTER') setSubscriptionTier('STARTER');
        else if (status === 'ENTERPRISE') setSubscriptionTier('ENTERPRISE');
        else setSubscriptionTier('TRIAL');
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setSubscriptionTier('TRIAL');
      }
    };
    
    const fetchLiveBotCount = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("bots")
          .select("id, is_live")
          .eq("user_id", user.id);
          
        if (error) throw error;
        
        // Count only bots that are actually live
        const liveBots = (data || []).filter(bot => bot.is_live).length;
        setLiveBotCount(liveBots);
      } catch (error) {
        console.error("Error fetching live bot count:", error);
      }
    };
    
    fetchBot();
    fetchUserSubscription();
    fetchLiveBotCount();
  }, [id, user]);

  useEffect(() => {
    const fetchKnowledgeSources = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("knowledge_sources")
          .select("*")
          .eq("bot_id", id)
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Process knowledge sources for display
          const knowledgeEntries = data.map(source => source.content);
          
          // Create a result for the KnowledgeBase component
          const knowledgeResult = {
            status: 'complete',
            results: data.map(source => ({
              url: source.source_type === 'url' ? source.content : 
                   source.source_type === 'file' ? `file-${source.id}` : 'knowledge-entry',
              title: source.source_type === 'url' ? new URL(source.content).hostname : 
                    source.source_type === 'file' ? `File: ${source.content.substring(0, 20)}...` : 'Knowledge Entry',
              content: source.content.substring(0, 1000) + (source.content.length > 1000 ? '...' : '')
            }))
          };
          
          // Update the chatbot service with the knowledge
          chatbotService.updateKnowledgeBase(knowledgeEntries);
          
          // Set the knowledge base data for display
          setKnowledgeBaseData(knowledgeResult);
        } else {
          // If no knowledge sources, set empty knowledge base
          setKnowledgeBaseData({
            status: 'complete',
            results: []
          });
        }
      } catch (error: any) {
        console.error("Error processing knowledge sources:", error);
        setKnowledgeBaseData({
          status: 'error',
          results: []
        });
      }
    };
    
    fetchKnowledgeSources();
  }, [id]);

  const copyEmbedCode = () => {
    if (!id) return;
    
    const embedCode = generateEmbedCode(id);
    navigator.clipboard.writeText(embedCode)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Embed code copied to clipboard",
        });
      })
      .catch(err => {
        console.error("Failed to copy:", err);
        toast({
          title: "Error",
          description: "Failed to copy embed code",
          variant: "destructive",
        });
      });
  };

  const handleSaveStyle = async (values: any) => {
    if (!id) return;

    try {
      const updateData = {
        name: values.botName,
        company: values.companyName,
      };
      
      const { error } = await supabase
        .from("bots")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setBotName(values.botName);
      setCompanyName(values.companyName);
      setBotColor(values.primaryColor);

      localStorage.setItem(`botColor_${id}`, values.primaryColor);

      toast({
        title: "Styles updated",
        description: "Your chatbot styling has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error updating bot style:", error);
      toast({
        title: "Error",
        description: "Failed to update chatbot styling",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    if (id) {
      const savedColor = localStorage.getItem(`botColor_${id}`);
      if (savedColor) {
        setBotColor(savedColor);
      }
    }
  }, [id]);

  const handleBotStatusChange = async (status: boolean) => {
    setIsLive(status);
    
    // Update the bot object to reflect the new status
    if (bot) {
      setBot({
        ...bot,
        is_live: status
      });
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchSubscriptionStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("users_metadata")
          .select("payment_status")
          .eq("id", user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        if (data) {
          const status = data.payment_status.toUpperCase();
          if (status === 'PAID' || status === 'PRO') {
            setSubscriptionTier('PRO');
          } else if (status === 'STARTER') {
            setSubscriptionTier('STARTER');
          } else if (status === 'ENTERPRISE') {
            setSubscriptionTier('ENTERPRISE');
          } else {
            setSubscriptionTier('TRIAL');
          }
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setSubscriptionTier('TRIAL');
      }
    };
    
    fetchSubscriptionStatus();
  }, [user]);

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
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <BotStatusToggle
                  botId={id!}
                  isLive={isLive}
                  userSubscription={subscriptionTier}
                  liveBotCount={liveBotCount}
                  onStatusChange={handleBotStatusChange}
                />
              </div>
            </div>
            
            <Tabs defaultValue="analytics" className="space-y-6">
              <TabsList className="w-full md:w-auto mb-6">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
                <TabsTrigger value="styling">Styling</TabsTrigger>
              </TabsList>
              
              <TabsContent value="analytics" className="space-y-6">
                <BotAnalytics botId={id!} />
              </TabsContent>
              
              <TabsContent value="integrations">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-4">Website Integration</h2>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Embed your chatbot on any website by adding the following code snippet to your HTML:
                    </p>
                    
                    <div className="relative mt-4">
                      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                        <code className="text-sm">{generateEmbedCode(id!)}</code>
                      </pre>
                      
                      <Button 
                        size="sm" 
                        className="absolute top-3 right-3"
                        onClick={copyEmbedCode}
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-8">
                    <h3 className="text-lg font-medium">Integration Instructions</h3>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">1. Copy the embed code</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Click the "Copy Code" button above to copy the code to your clipboard.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">2. Add to your website</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Paste the code into the HTML of your website, ideally just before the closing <code>&lt;/body&gt;</code> tag.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">3. Save and refresh</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Save your changes and refresh your website. Your chatbot should appear as a floating button in the bottom right corner.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="knowledge" className="space-y-6">
                <KnowledgeBaseManager botId={id!} />
                
                {knowledgeBaseData && knowledgeBaseData.results.length > 0 ? (
                  <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Current Knowledge Sources</h2>
                    <KnowledgeBase scrapeResult={knowledgeBaseData} />
                  </div>
                ) : (
                  <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-2">No Knowledge Sources</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your bot doesn't have any knowledge sources yet. Add some files or website URLs above
                      to train your chatbot with specific information.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="styling">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="flex items-center mb-4">
                      <Palette className="h-5 w-5 mr-2 text-primary" />
                      <h2 className="text-xl font-semibold">Customize Appearance</h2>
                    </div>
                    
                    <ChatbotStylingForm 
                      initialValues={{
                        botName,
                        companyName,
                        primaryColor: botColor
                      }}
                      onSave={handleSaveStyle}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Preview</h3>
                    <ChatbotEmulator 
                      botName={botName} 
                      companyName={companyName} 
                      knowledge={knowledgeBaseData || { status: 'complete', results: [] }}
                      primaryColor={botColor}
                    />
                  </div>
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
