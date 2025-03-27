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
import { ArrowLeft, Save, PlusCircle, ArrowRight } from "lucide-react";
import { SubscriptionTier } from "@/lib/types/billing";
import ChatbotEmulator from "@/components/ChatbotEmulator";

// Define the allowed knowledge source types as a type
type KnowledgeSourceType = "website" | "text" | "file";

interface KnowledgeSource {
  type: KnowledgeSourceType;
  content: string;
}

const steps = [
  { id: "basics", title: "Basic Information" },
  { id: "knowledge", title: "Knowledge Sources" },
  { id: "review", title: "Review & Create" },
];

const CreateBot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
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
    type: KnowledgeSourceType,
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
              source_type: source.type, // Map type to source_type
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

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // Mock knowledge for the emulator
  const mockKnowledge = {
    status: "complete" as const,
    results: knowledgeSources.map((source, index) => ({
      url: source.type === "website" ? source.content : `https://example.com/doc${index}`,
      title: source.type === "website" ? `Website ${index + 1}` : `Document ${index + 1}`,
      content: source.type === "text" ? source.content : `Sample content from ${source.type} ${index + 1}`,
    })),
    totalUrls: knowledgeSources.length,
    processedUrls: knowledgeSources.length,
    progress: 1,
    error: undefined,
    websiteUrl: knowledgeSources.find(source => source.type === "website")?.content || "https://example.com",
    content: undefined
  };

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left side - Step form */}
          <div className="lg:w-1/2">
            {/* Step indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        idx <= currentStep
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`h-1 w-16 ${
                          idx < currentStep
                            ? "bg-blue-600"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
              <h2 className="text-xl font-semibold">
                {steps[currentStep].title}
              </h2>
            </div>

            {currentStep === 0 && (
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
                    <Switch
                      id="is_live"
                      checked={isLive}
                      onCheckedChange={setIsLive}
                    />
                    <Label htmlFor="is_live">Set Bot Live</Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
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
                        Add a website URL or paste text for this source.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`type-${index}`}>Type</Label>
                        <Select
                          onValueChange={(value: KnowledgeSourceType) =>
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

                      {knowledgeSources.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveKnowledgeSource(index)}
                        >
                          Remove Source
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Bot Configuration</CardTitle>
                  <CardDescription>
                    Review your bot settings before creating it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Bot Name</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {name || "Unnamed Bot"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Company</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {company || "Not specified"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bot Type</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {botType ? botType.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Not specified"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Knowledge Sources</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded space-y-2">
                      {knowledgeSources.length > 0 ? (
                        knowledgeSources.map((source, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{source.type}: </span>
                            <span>
                              {source.content.length > 50
                                ? `${source.content.substring(0, 50)}...`
                                : source.content || "Not specified"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div>No knowledge sources added</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="mr-2">{isLive ? "Live" : "Not Live"}</div>
                    <Switch
                      checked={isLive}
                      onCheckedChange={setIsLive}
                      className="ml-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Back
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={nextStep}
                  disabled={
                    (currentStep === 0 && (!name || !company || !botType)) ||
                    (currentStep === 1 && knowledgeSources.some(source => !source.content))
                  }
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
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
              )}
            </div>
          </div>

          {/* Right side - Chatbot Emulator */}
          <div className="lg:w-1/2 mt-8 lg:mt-0">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Preview Your Bot</h3>
              <ChatbotEmulator
                botName={name || "AI Assistant"}
                companyName={company || "Your Company"}
                knowledge={mockKnowledge}
                primaryColor="#3b82f6"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateBot;
