
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
import { ArrowLeft, Save, PlusCircle, ArrowRight, Upload, Globe } from "lucide-react";
import { SubscriptionTier } from "@/lib/types/billing";
import ChatbotEmulator from "@/components/ChatbotEmulator";
import useScrapeWebsite from "@/hooks/useScrapeWebsite";
import ScrapeStatus from "@/components/ScrapeStatus";
import generateEmbedCode from "@/utils/generateEmbedCode";

// Define the allowed knowledge source types as a type
type KnowledgeSourceType = "website" | "text" | "file";

interface KnowledgeSource {
  type: KnowledgeSourceType;
  content: string;
}

// Define the steps for bot creation
const steps = [
  { id: "knowledge", title: "Knowledge Sources" },
  { id: "basics", title: "Bot Information" },
  { id: "review", title: "Preview & Test" },
  { id: "payment", title: "Payment & Embed" },
];

const MAX_BOTS = {
  TRIAL: 1,
  STARTER: 3,
  PRO: 10,
  ENTERPRISE: 100
};

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
  const [userBotCount, setUserBotCount] = useState(0);
  const [botId, setBotId] = useState<string | null>(null);
  const [embedCode, setEmbedCode] = useState("");
  
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('TRIAL');
  const { scrapeProgress, startScraping } = useScrapeWebsite();
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  
  // Fetch user's existing bot count
  useEffect(() => {
    if (!user) return;
    
    const fetchUserBots = async () => {
      try {
        const { data, error, count } = await supabase
          .from("bots")
          .select("*", { count: 'exact' })
          .eq("user_id", user.id);
          
        if (error) throw error;
        
        setUserBotCount(count || 0);
      } catch (error) {
        console.error("Error fetching user bots:", error);
      }
    };
    
    fetchUserBots();
  }, [user]);
  
  // Check if user reached their bot limit
  const hasReachedBotLimit = () => {
    return userBotCount >= MAX_BOTS[subscriptionTier];
  };
  
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
  
  const handleScrapeWebsite = async () => {
    if (!scrapeUrl) {
      toast.error("Please enter a URL to scrape");
      return;
    }
    
    setIsScraping(true);
    
    try {
      const result = await startScraping(scrapeUrl);
      
      if (result && result.status === "complete") {
        // Add the scraped website as a knowledge source
        setKnowledgeSources(prev => [
          ...prev,
          { type: "website", content: scrapeUrl }
        ]);
        
        toast.success("Website scraped successfully!");
      }
    } catch (error) {
      console.error("Error scraping website:", error);
      toast.error("Failed to scrape website");
    } finally {
      setIsScraping(false);
    }
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

      // Store the bot ID for the embed code
      setBotId(botData.id);
      
      // Generate embed code
      setEmbedCode(generateEmbedCode(botData.id));

      // Add knowledge sources
      for (const source of knowledgeSources) {
        const { error: sourceError } = await supabase
          .from("knowledge_sources")
          .insert([
            {
              bot_id: botData.id,
              source_type: source.type,
              content: source.content,
            },
          ]);

        if (sourceError) throw sourceError;
      }

      toast.success("Bot created successfully");
      
      // Move to final step instead of navigating away
      setCurrentStep(steps.length - 1);
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
    if (currentStep === 2 && !botId) {
      // If we're on the review step and haven't created the bot yet, create it
      handleSubmit();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };
  
  const finishAndGoToDashboard = () => {
    navigate("/dashboard");
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

  const copyEmbedCode = () => {
    if (!embedCode) return;
    
    navigator.clipboard.writeText(embedCode)
      .then(() => toast.success("Embed code copied to clipboard"))
      .catch(() => toast.error("Failed to copy embed code"));
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
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Knowledge Sources</CardTitle>
                    <CardDescription>
                      Add websites, text, or files to train your bot.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Scrape Website Section */}
                    <div className="space-y-4">
                      <Label>Scrape a Website</Label>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter website URL (e.g., example.com)"
                          value={scrapeUrl}
                          onChange={(e) => setScrapeUrl(e.target.value)}
                          className="flex-1"
                          disabled={isScraping}
                        />
                        <Button 
                          onClick={handleScrapeWebsite} 
                          disabled={isScraping || !scrapeUrl}
                          className="whitespace-nowrap"
                        >
                          <Globe className="mr-2 h-4 w-4" />
                          {isScraping ? "Scraping..." : "Scrape"}
                        </Button>
                      </div>
                      
                      {isScraping && scrapeProgress.status !== 'idle' && (
                        <ScrapeStatus progress={scrapeProgress} />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Manual Sources</h3>
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
                                <SelectItem value="file">File Upload</SelectItem>
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
                            ) : source.type === "file" ? (
                              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-2">
                                  <label
                                    htmlFor={`file-upload-${index}`}
                                    className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                                  >
                                    <span>Upload a file</span>
                                    <input
                                      id={`file-upload-${index}`}
                                      name="file-upload"
                                      type="file"
                                      className="sr-only"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleKnowledgeSourceChange(
                                            index,
                                            source.type,
                                            file.name
                                          );
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  PDF, TXT, DOCX up to 10MB
                                </p>
                                {source.content && (
                                  <p className="mt-2 text-sm text-gray-900">
                                    {source.content}
                                  </p>
                                )}
                              </div>
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
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 1 && (
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
                      disabled={hasReachedBotLimit()}
                    />
                    <div>
                      <Label htmlFor="is_live">Set Bot Live</Label>
                      {hasReachedBotLimit() && (
                        <p className="text-xs text-red-500 mt-1">
                          You've reached your limit of {MAX_BOTS[subscriptionTier]} bots for your {subscriptionTier.toLowerCase()} plan.
                          Upgrade to enable more bots.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview & Test</CardTitle>
                  <CardDescription>
                    Preview your bot and test its functionality.
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
                      disabled={hasReachedBotLimit()}
                      className="ml-2"
                    />
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Try chatting with your bot to ensure it works as expected.
                    When you're ready, click Next to finalize your bot.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deployment & Integration</CardTitle>
                  <CardDescription>
                    Get the embed code for your bot and choose a subscription plan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Subscription Plan</Label>
                    <Select defaultValue={subscriptionTier}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRIAL">Trial (Free)</SelectItem>
                        <SelectItem value="STARTER">Starter ($29/month)</SelectItem>
                        <SelectItem value="PRO">Professional ($99/month)</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise (Custom pricing)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Your current plan: {subscriptionTier}. {
                        subscriptionTier === 'TRIAL' ? 
                        'Upgrade for more features and bot slots.' : 
                        'Thank you for your subscription!'
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Embed Code</Label>
                    <div className="relative">
                      <Textarea
                        value={embedCode}
                        readOnly
                        rows={5}
                        className="font-mono text-xs"
                      />
                      <Button 
                        className="absolute top-2 right-2" 
                        size="sm"
                        variant="secondary"
                        onClick={copyEmbedCode}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Copy this code and paste it into your website's HTML to embed your chatbot.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Integration Instructions</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-sm">
                      <li>Copy the embed code above.</li>
                      <li>Paste it just before the closing <code>&lt;/body&gt;</code> tag in your website's HTML.</li>
                      <li>The chatbot will appear as a button in the bottom right corner of your website.</li>
                      <li>Customize the appearance in the Dashboard if needed.</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                >
                  Back
                </Button>
              )}
              {currentStep === 0 && (
                <div></div> // Empty div to maintain flex spacing
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={nextStep}
                  disabled={
                    (currentStep === 0 && knowledgeSources.some(source => !source.content)) ||
                    (currentStep === 1 && (!name || !company || !botType))
                  }
                >
                  {currentStep === 2 && !botId ? "Create Bot" : "Next"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={finishAndGoToDashboard}>
                  <Save className="mr-2 h-4 w-4" />
                  Finish & Go to Dashboard
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
