import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, PlusCircle } from "lucide-react";
import { SubscriptionTier } from "@/lib/types/billing";

interface KnowledgeSource {
  type: "website" | "text" | "file";
  content: string;
}

const CreateBot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [botType, setBotType] = useState("");
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([
    { type: "website", content: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('TRIAL');
  
  const handleAddKnowledgeSource = () => {
    setKnowledgeSources([...knowledgeSources, { type: "website", content: "" }]);
  };

  const handleKnowledgeSourceChange = (
    index: number,
    type: string,
    content: string
  ) => {
    const updatedSources = [...knowledgeSources];
    updatedSources[index] = { type, content };
    setKnowledgeSources(updatedSources);
  };

  const handleRemoveKnowledgeSource = (index: number) => {
    const updatedSources = [...knowledgeSources];
    updatedSources.splice(index, 1);
    setKnowledgeSources(updatedSources);
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Create the bot
      const { data: botData, error: botError } = await supabase
        .from("bots")
        .insert([
          {
            user_id: user.id,
            name,
            company,
            bot_type: botType,
            is_live: isLive,
          },
        ])
        .select()
        .single();

      if (botError) throw botError;

      // Add knowledge sources
      for (const source of knowledgeSources) {
        const { error: sourceError } = await supabase
          .from("knowledge_sources")
          .insert([
            {
              bot_id: botData.id,
              type: source.type,
              content: source.content,
            },
          ]);

        if (sourceError) throw sourceError;
      }

      toast.success("Bot created successfully");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating bot:", error);
      toast.error("Failed to create bot: " + error.message);
    } finally {
      setLoading(false);
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
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Bot
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Bot Information</CardTitle>
            <CardDescription>
              Enter the basic information for your new bot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Bot"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bot_type">Bot Type</Label>
              <Select onValueChange={setBotType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a bot type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_support">Customer Support</SelectItem>
                  <SelectItem value="sales_assistant">Sales Assistant</SelectItem>
                  <SelectItem value="information_retrieval">Information Retrieval</SelectItem>
                  <SelectItem value="personal_assistant">Personal Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="is_live">Set Bot Live</Label>
              <Switch
                id="is_live"
                checked={isLive}
                onCheckedChange={setIsLive}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Knowledge Sources
            </h2>
            <Button variant="outline" size="sm" onClick={handleAddKnowledgeSource}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Source
            </Button>
          </div>

          {knowledgeSources.map((source, index) => (
            <Card key={index} className="mb-4">
              <CardHeader>
                <CardTitle>Knowledge Source #{index + 1}</CardTitle>
                <CardDescription>
                  Add a website URL, paste text, or upload a file for this
                  source.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`type-${index}`}>Type</Label>
                  <Select
                    onValueChange={(value) =>
                      handleKnowledgeSourceChange(index, value, source.content)
                    }
                    defaultValue={source.type}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a source type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website URL</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`content-${index}`}>Content</Label>
                  {source.type === "text" ? (
                    <Textarea
                      id={`content-${index}`}
                      placeholder="Paste your text here"
                      value={source.content}
                      onChange={(e) =>
                        handleKnowledgeSourceChange(
                          index,
                          source.type,
                          e.target.value
                        )
                      }
                      rows={4}
                    />
                  ) : (
                    <Input
                      id={`content-${index}`}
                      placeholder="Enter website URL"
                      value={source.content}
                      onChange={(e) =>
                        handleKnowledgeSourceChange(
                          index,
                          source.type,
                          e.target.value
                        )
                      }
                    />
                  )}
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeSource(index)}
                >
                  Remove Source
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end mt-8">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>Creating...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Bot
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CreateBot;
