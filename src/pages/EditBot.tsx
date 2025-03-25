
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import ChatbotEmulator from "@/components/ChatbotEmulator";
import { ScrapeProgress, initialScrapeProgress } from "@/utils/scraper";

interface Bot {
  id: string;
  name: string;
  company: string;
  created_at: string;
}

const EditBot = () => {
  const { id } = useParams<{ id: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
            
            {/* Here you could add components to view and manage knowledge sources */}
            <Button onClick={() => navigate(`/create-bot`)}>
              Add More Knowledge
            </Button>
          </div>
        </div>
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
            knowledge={initialScrapeProgress}
          />
        </div>
      </div>
    </div>
  );
};

export default EditBot;
