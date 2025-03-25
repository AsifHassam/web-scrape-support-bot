
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Copy } from "lucide-react";
import { toast } from "sonner";
import ChatbotEmulator from "@/components/ChatbotEmulator";
import { ScrapeProgress, initialScrapeProgress } from "@/utils/scraper";
import { useScrapeWebsite } from "@/hooks/useScrapeWebsite";
import { generateEmbedCode } from "@/utils/generateEmbedCode";

interface Bot {
  id: string;
  name: string;
  company: string;
  created_at: string;
}

interface KnowledgeSource {
  id: string;
  bot_id: string;
  source_type: string;
  content: string;
  created_at: string;
}

const EditBot = () => {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress>(initialScrapeProgress);
  const { startScraping } = useScrapeWebsite();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBot = async () => {
      try {
        if (!id) return;

        const { data, error } = await supabase
          .from("bots")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        setBot(data);
        setName(data.name);
        setCompany(data.company || "");

        // Fetch knowledge sources
        const { data: sourcesData, error: sourcesError } = await supabase
          .from("knowledge_sources")
          .select("*")
          .eq("bot_id", id);

        if (sourcesError) throw sourcesError;
        
        setKnowledgeSources(sourcesData || []);

        // If we have website sources, update the scrape progress accordingly
        const websiteSources = sourcesData?.filter(source => source.source_type === 'website') || [];
        if (websiteSources.length > 0) {
          // Mock a completed scrape for visualization purposes
          const mockProgress: ScrapeProgress = {
            ...initialScrapeProgress,
            status: 'complete',
            progress: 1,
            totalUrls: 5,
            processedUrls: 5,
            results: websiteSources.map(source => ({
              url: source.content,
              title: `Content from ${source.content}`,
              content: `This is content scraped from ${source.content}`,
              links: [],
              timestamp: source.created_at,
              status: 'success'
            }))
          };
          setScrapeProgress(mockProgress);
        }
      } catch (error: any) {
        toast.error("Error loading bot: " + error.message);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!id || !name) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bots")
        .update({ name, company })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Bot updated successfully");
      setBot(prev => prev ? { ...prev, name, company } : null);
    } catch (error: any) {
      toast.error("Error updating bot: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRescrape = async (websiteUrl: string) => {
    if (!websiteUrl) return;
    
    try {
      toast.info("Starting scrape process...");
      const progress = await startScraping(websiteUrl);
      
      // If scrape was successful, add or update the knowledge source
      if (progress && progress.status === 'complete' && id) {
        // Check if this URL already exists as a source
        const existingSource = knowledgeSources.find(
          source => source.source_type === 'website' && source.content === websiteUrl
        );
        
        if (existingSource) {
          // Update timestamp of existing source
          const { error } = await supabase
            .from("knowledge_sources")
            .update({ created_at: new Date().toISOString() })
            .eq("id", existingSource.id);
            
          if (error) throw error;
        } else {
          // Add new knowledge source
          const { error } = await supabase
            .from("knowledge_sources")
            .insert({
              bot_id: id,
              source_type: 'website',
              content: websiteUrl
            });
            
          if (error) throw error;
        }
        
        // Refresh knowledge sources
        const { data, error } = await supabase
          .from("knowledge_sources")
          .select("*")
          .eq("bot_id", id);
          
        if (error) throw error;
        setKnowledgeSources(data || []);
        
        toast.success("Knowledge base updated successfully");
      }
    } catch (error: any) {
      toast.error("Error scraping website: " + error.message);
    }
  };

  const handleAddMoreKnowledge = () => {
    // Navigate to create-bot with the current bot ID to add more knowledge
    if (id) {
      navigate(`/create-bot?edit=${id}`);
    }
  };

  const renderEmbedCode = () => {
    if (!id) return null;
    
    const embedCode = generateEmbedCode(id);
    
    return (
      <div className="space-y-4 mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Embed Code
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Website Integration</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(embedCode);
                toast.success("The embed code has been copied to your clipboard");
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          
          <div className="relative">
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
              {embedCode}
            </pre>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Add this code to your website to embed the chatbot widget.</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <div className="w-full lg:w-7/12 p-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Edit Chatbot
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="botName">Bot Name</Label>
            <Input
              id="botName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter bot name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter company name"
            />
          </div>

          <Button onClick={handleSave} disabled={saving || !name} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
            {!saving && <Save className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {/* Knowledge sources section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Knowledge Base
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your bot's knowledge sources are listed below. You can add new sources or update existing ones.
            </p>
            
            {knowledgeSources.length > 0 ? (
              <div className="space-y-4">
                {knowledgeSources.map(source => (
                  <div key={source.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{source.source_type === 'website' ? '🌐 Website URL' : '📄 Document'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{source.content}</p>
                      </div>
                      
                      {source.source_type === 'website' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRescrape(source.content)}
                        >
                          Re-scrape
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No knowledge sources found for this bot.</p>
            )}
            
            <div className="mt-6">
              <Button onClick={handleAddMoreKnowledge}>
                Add More Knowledge
              </Button>
            </div>
          </div>
        </div>
        
        {/* Embed code section */}
        {renderEmbedCode()}
      </div>

      {/* Chat Widget Preview */}
      <div className="hidden lg:block lg:w-5/12 bg-gray-100 dark:bg-gray-800 p-8 border-l border-gray-200 dark:border-gray-700">
        <div className="sticky top-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Chatbot Preview
          </h2>
          <ChatbotEmulator 
            botName={name || "AI Assistant"} 
            companyName={company || "Your Company"}
            knowledge={scrapeProgress}
          />
        </div>
      </div>
    </div>
  );
};

export default EditBot;
