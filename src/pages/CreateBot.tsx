
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, FileUp, Globe, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useScrapeWebsite } from "@/hooks/useScrapeWebsite";
import ChatbotEmulator from "@/components/ChatbotEmulator";
import { initialScrapeProgress } from "@/utils/scraper";
import { normalizeUrl, isValidUrl } from '@/utils/urlUtils';
import BotTypeSelector from '@/components/BotTypeSelector';
import PaymentGateway from "@/components/PaymentGateway";
import generateEmbedCode from '@/utils/generateEmbedCode';

type BotType = 
  | 'educational' 
  | 'health' 
  | 'customer_support' 
  | 'it_support' 
  | 'ecommerce' 
  | 'hr' 
  | 'personal' 
  | 'lead_generation' 
  | 'other';

interface BotFormData {
  name: string;
  company: string;
  botType: BotType | '';
  knowledgeSources: {
    useWebsite: boolean;
    websiteUrl: string;
    usePdfs: boolean;
    pdfFiles: File[];
  };
}

const CreateBot = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BotFormData>({
    name: "",
    company: "",
    botType: "",
    knowledgeSources: {
      useWebsite: true,
      websiteUrl: "",
      usePdfs: false,
      pdfFiles: [],
    },
  });
  const [embedCode, setEmbedCode] = useState("");
  const [botId, setBotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [urlScraped, setUrlScraped] = useState(false);
  const { scrapeProgress, startScraping } = useScrapeWebsite();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (botId) {
      const code = generateEmbedCode(botId);
      setEmbedCode(code);
    }
  }, [botId]);

  const handleScrapeWebsite = async () => {
    if (!formData.knowledgeSources.websiteUrl) {
      toast.error("Please enter a website URL");
      return;
    }

    const normalizedUrl = normalizeUrl(formData.knowledgeSources.websiteUrl);
    
    if (!isValidUrl(normalizedUrl)) {
      toast.error("Please enter a valid website URL");
      return;
    }

    setLoading(true);
    try {
      await startScraping(normalizedUrl);
      setUrlScraped(true);
      toast.success("Website scraped successfully!");
    } catch (error: any) {
      toast.error("Failed to scrape website: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        knowledgeSources: {
          ...formData.knowledgeSources,
          pdfFiles: [...formData.knowledgeSources.pdfFiles, ...Array.from(e.target.files)],
        }
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...formData.knowledgeSources.pdfFiles];
    updatedFiles.splice(index, 1);
    setFormData({
      ...formData,
      knowledgeSources: {
        ...formData.knowledgeSources,
        pdfFiles: updatedFiles
      }
    });
  };

  const validateStep = () => {
    if (step === 1) {
      if (formData.knowledgeSources.useWebsite && !formData.knowledgeSources.websiteUrl) {
        toast.error("Please enter a website URL or uncheck the website option");
        return false;
      }
      
      if (formData.knowledgeSources.useWebsite && !urlScraped) {
        toast.error("Please scrape the website first");
        return false;
      }
      
      if (formData.knowledgeSources.usePdfs && formData.knowledgeSources.pdfFiles.length === 0) {
        toast.error("Please upload at least one PDF file or uncheck the PDF option");
        return false;
      }
      
      if (!formData.knowledgeSources.useWebsite && !formData.knowledgeSources.usePdfs) {
        toast.error("Please select at least one knowledge source");
        return false;
      }
    } else if (step === 2) {
      if (!formData.name) {
        toast.error("Please enter a bot name");
        return false;
      }
    }
    
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    
    if (step === 3) {
      setLoading(true);
      try {
        // Create the bot first
        const { data: botData, error: botError } = await supabase
          .from("bots")
          .insert({
            name: formData.name,
            company: formData.company,
            bot_type: formData.botType,
            user_id: user?.id,
          })
          .select()
          .single();

        if (botError) throw botError;
        
        const newBotId = botData.id;
        setBotId(newBotId);

        // Add knowledge sources for the newly created bot
        const knowledgeSourcesToAdd = [];
        
        if (formData.knowledgeSources.useWebsite && formData.knowledgeSources.websiteUrl) {
          knowledgeSourcesToAdd.push({
            bot_id: newBotId,
            source_type: "website",
            content: formData.knowledgeSources.websiteUrl,
          });
        }
        
        if (formData.knowledgeSources.usePdfs && formData.knowledgeSources.pdfFiles.length > 0) {
          // Add simple metadata about PDF files since actual content would need further processing
          knowledgeSourcesToAdd.push({
            bot_id: newBotId,
            source_type: "document",
            content: `${formData.knowledgeSources.pdfFiles.length} PDF files uploaded`,
          });
        }
        
        if (knowledgeSourcesToAdd.length > 0) {
          console.log("Adding knowledge sources:", knowledgeSourcesToAdd);
          const { error: sourceError } = await supabase
            .from("knowledge_sources")
            .insert(knowledgeSourcesToAdd);

          if (sourceError) {
            console.error("Error adding knowledge sources:", sourceError);
            toast.error("Warning: Bot created but failed to add knowledge sources. You can add them later.");
          }
        }

        toast.success("Chatbot created successfully!");
        setStep(4);
      } catch (error: any) {
        console.error("Error details:", error);
        toast.error("Error creating bot: " + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handlePaymentComplete = () => {
    setStep(5);
  };

  const handlePaymentCancel = () => {
    setStep(3);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Code copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <div className="w-full lg:w-7/12 p-8">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>

          <Link to="/" className="flex items-center space-x-2">
            <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 text-white"
              >
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="17" x2="12" y2="17"></line>
              </svg>
            </span>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">Chatwise</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {step === 5 ? "Your Bot is Ready!" : "Create New Chatbot"}
        </h1>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8 dark:bg-gray-700">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Step 1: Set Up Knowledge Base
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose how you want to feed your chatbot with information
            </p>

            <div className="space-y-6">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="useWebsite" 
                  checked={formData.knowledgeSources.useWebsite}
                  onCheckedChange={(checked) => 
                    setFormData({
                      ...formData,
                      knowledgeSources: {
                        ...formData.knowledgeSources,
                        useWebsite: checked as boolean
                      }
                    })
                  }
                />
                <div className="space-y-4 flex-1">
                  <Label 
                    htmlFor="useWebsite" 
                    className="font-medium flex items-center cursor-pointer"
                  >
                    <Globe className="mr-2 h-5 w-5 text-primary" />
                    Website URL
                  </Label>
                  
                  {formData.knowledgeSources.useWebsite && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="websiteUrl"
                            placeholder="example.com"
                            value={formData.knowledgeSources.websiteUrl}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                knowledgeSources: {
                                  ...formData.knowledgeSources,
                                  websiteUrl: e.target.value
                                }
                              })
                            }
                          />
                          <Button 
                            onClick={handleScrapeWebsite} 
                            disabled={loading || !formData.knowledgeSources.websiteUrl}
                          >
                            {loading ? "Scraping..." : "Scrape"}
                          </Button>
                        </div>
                      </div>
                      
                      {scrapeProgress.status !== 'idle' && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <h3 className="font-medium mb-2">Scraping Status</h3>
                          <div className="space-y-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${scrapeProgress.progress * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                {scrapeProgress.processedUrls} / {scrapeProgress.totalUrls || "?"} URLs
                              </span>
                              <span>
                                {scrapeProgress.status === "complete"
                                  ? "Complete"
                                  : scrapeProgress.status === "error"
                                  ? "Error"
                                  : "In progress"}
                              </span>
                            </div>
                            {scrapeProgress.status === "error" && (
                              <p className="text-red-500 text-sm">{scrapeProgress.error}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="usePdfs" 
                  checked={formData.knowledgeSources.usePdfs}
                  onCheckedChange={(checked) => 
                    setFormData({
                      ...formData,
                      knowledgeSources: {
                        ...formData.knowledgeSources,
                        usePdfs: checked as boolean
                      }
                    })
                  }
                />
                <div className="space-y-4 flex-1">
                  <Label 
                    htmlFor="usePdfs" 
                    className="font-medium flex items-center cursor-pointer"
                  >
                    <FileUp className="mr-2 h-5 w-5 text-primary" />
                    Upload PDF Files
                  </Label>
                  
                  {formData.knowledgeSources.usePdfs && (
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                        <input
                          id="pdfUpload"
                          type="file"
                          accept=".pdf"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <label
                          htmlFor="pdfUpload"
                          className="flex flex-col items-center cursor-pointer"
                        >
                          <FileUp className="h-10 w-10 text-gray-400 mb-2" />
                          <span className="text-gray-600 dark:text-gray-400 mb-1">
                            Drag & drop files or click to browse
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            Supports PDF files
                          </span>
                        </label>
                      </div>
                      {formData.knowledgeSources.pdfFiles.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Selected files:</p>
                          <ul className="space-y-2">
                            {formData.knowledgeSources.pdfFiles.map((file, index) => (
                              <li key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                <div className="flex-1 truncate">
                                  <span className="text-sm">{file.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({(file.size / 1024).toFixed(0)} KB)
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-500 hover:text-red-500"
                                  onClick={() => handleRemoveFile(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Step 2: Bot Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Provide basic information about your chatbot
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botName">Bot Name *</Label>
                <Input
                  id="botName"
                  placeholder="e.g. Support Assistant"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  placeholder="e.g. Acme Inc."
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              
              <BotTypeSelector 
                value={formData.botType}
                onChange={(value) => setFormData({ ...formData, botType: value })}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Step 3: Review and Create
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Review your bot's configuration before creating it
            </p>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Bot Name
                </h3>
                <p className="mt-1 text-gray-900 dark:text-white">{formData.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Company
                </h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {formData.company || "Not specified"}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Bot Type
                </h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {formData.botType ? formData.botType.replace('_', ' ').charAt(0).toUpperCase() + formData.botType.replace('_', ' ').slice(1) : "Not specified"}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Knowledge Base
                </h3>
                <div className="mt-1 space-y-1">
                  {formData.knowledgeSources.useWebsite && (
                    <p className="text-gray-900 dark:text-white">
                      Website: {formData.knowledgeSources.websiteUrl}
                    </p>
                  )}
                  {formData.knowledgeSources.usePdfs && (
                    <p className="text-gray-900 dark:text-white">
                      {formData.knowledgeSources.pdfFiles.length} PDF files
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <PaymentGateway 
            botId={botId || ""} 
            onPaymentComplete={handlePaymentComplete}
            onCancel={handlePaymentCancel}
          />
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Implementation
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Add this code to your website to embed the chatbot
            </p>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Embed Code</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyToClipboard}
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

            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h3 className="text-primary font-medium mb-2">What's next?</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc list-inside">
                <li>Add the code above to your website's HTML</li>
                <li>The chatbot will automatically appear on your website</li>
                <li>You can edit your bot's knowledge at any time from the dashboard</li>
                <li>Monitor performance and user interactions in the analytics section</li>
              </ul>
            </div>

            <div className="pt-4">
              <Button onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

        {step < 5 && (
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            ) : (
              <div></div>
            )}
            {step !== 4 && (
              <Button onClick={handleNext} disabled={loading}>
                {step === 3 ? (loading ? "Creating..." : "Create Bot") : "Next"}
                {step < 3 && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="hidden lg:block lg:w-5/12 bg-gray-100 dark:bg-gray-800 p-8 border-l border-gray-200 dark:border-gray-700">
        <div className="sticky top-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Chatbot Preview
          </h2>
          <ChatbotEmulator 
            botName={formData.name || "AI Assistant"} 
            companyName={formData.company || "Your Company"}
            knowledge={
              scrapeProgress.status === 'complete' ? 
              scrapeProgress : 
              initialScrapeProgress
            }
          />
        </div>
      </div>
    </div>
  );
};

export default CreateBot;
