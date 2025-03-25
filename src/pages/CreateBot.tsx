import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, FileUp, Globe, ClipboardCopy, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useScrapeWebsite } from "@/hooks/useScrapeWebsite";
import ChatbotEmulator from "@/components/ChatbotEmulator";
import { initialScrapeProgress } from "@/utils/scraper";
import { chatbotService } from "@/utils/chatbot";
import { generateEmbedCode } from '@/utils/generateEmbedCode';

interface BotFormData {
  name: string;
  company: string;
  knowledgeType: "website" | "pdf";
  websiteUrl: string;
  pdfFiles: File[];
}

const CreateBot = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BotFormData>({
    name: "",
    company: "",
    knowledgeType: "website",
    websiteUrl: "",
    pdfFiles: [],
  });
  const [embedCode, setEmbedCode] = useState("");
  const [botId, setBotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { scrapeProgress, startScraping } = useScrapeWebsite();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (botId) {
      const code = `<script>
  (function(w, d, s, o, f, js, fjs) {
    w['MyBotWidget'] = o;
    w[o] = w[o] || function() {
      (w[o].q = w[o].q || []).push(arguments)
    };
    js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = o;
    js.src = f;
    js.async = 1;
    fjs.parentNode.insertBefore(js, fjs);
  }(window, document, 'script', 'mw', 'https://chatbot-widget.example.com/widget.js'));
  mw('init', { botId: '${botId}' });
</script>`;
      setEmbedCode(code);
    }
  }, [botId]);

  const handleScrapeWebsite = async () => {
    if (!formData.websiteUrl) {
      toast.error("Please enter a website URL");
      return;
    }

    setLoading(true);
    try {
      await startScraping(formData.websiteUrl);
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
        pdfFiles: Array.from(e.target.files),
      });
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (formData.knowledgeType === "website" && !formData.websiteUrl) {
        toast.error("Please enter a website URL");
        return;
      }
      if (formData.knowledgeType === "pdf" && formData.pdfFiles.length === 0) {
        toast.error("Please upload at least one PDF file");
        return;
      }
    } else if (step === 2) {
      if (!formData.name) {
        toast.error("Please enter a bot name");
        return;
      }
    }

    if (step === 3) {
      setLoading(true);
      try {
        const { data: botData, error: botError } = await supabase
          .from("bots")
          .insert({
            name: formData.name,
            company: formData.company,
            user_id: user?.id,
          })
          .select()
          .single();

        if (botError) throw botError;
        
        const newBotId = botData.id;
        setBotId(newBotId);

        const sourceType = formData.knowledgeType === "website" ? "website" : "document";
        const content = formData.knowledgeType === "website" ? formData.websiteUrl : "PDF files uploaded";
        
        const { error: sourceError } = await supabase
          .from("knowledge_sources")
          .insert({
            bot_id: newBotId,
            source_type: sourceType,
            content: content,
          });

        if (sourceError) throw sourceError;

        toast.success("Chatbot created successfully!");
        setStep(4);
      } catch (error: any) {
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const renderEmbedCode = () => {
    const embedCode = generateEmbedCode(botId || 'demo-bot');
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Embed Code</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(embedCode);
              toast({
                title: "Copied to clipboard",
                description: "The embed code has been copied to your clipboard",
              });
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
    );
  };

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
          {step === 4 ? "Your Bot is Ready!" : "Create New Chatbot"}
        </h1>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8 dark:bg-gray-700">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
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

            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={formData.knowledgeType === "website" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, knowledgeType: "website" })}
                  className="flex-1 flex items-center justify-center"
                >
                  <Globe className="mr-2 h-5 w-5" />
                  Website URL
                </Button>
                <Button
                  variant={formData.knowledgeType === "pdf" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, knowledgeType: "pdf" })}
                  className="flex-1 flex items-center justify-center"
                >
                  <FileUp className="mr-2 h-5 w-5" />
                  Upload PDFs
                </Button>
              </div>

              {formData.knowledgeType === "website" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="websiteUrl"
                        placeholder="https://example.com"
                        value={formData.websiteUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, websiteUrl: e.target.value })
                        }
                      />
                      <Button 
                        onClick={handleScrapeWebsite} 
                        disabled={loading || !formData.websiteUrl}
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
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="pdfUpload">Upload PDF files</Label>
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
                  {formData.pdfFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Selected files:</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {formData.pdfFiles.map((file, index) => (
                          <li key={index} className="flex items-center">
                            <span className="truncate">{file.name}</span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
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
                  Knowledge Base
                </h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {formData.knowledgeType === "website"
                    ? `Website: ${formData.websiteUrl}`
                    : `${formData.pdfFiles.length} PDF files`}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Step 4: Implementation
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Add this code to your website to embed the chatbot
            </p>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 relative">
              {renderEmbedCode()}
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

        {step < 4 && (
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            ) : (
              <div></div>
            )}
            <Button onClick={handleNext} disabled={loading}>
              {step === 3 ? (loading ? "Creating..." : "Create Bot") : "Next"}
              {step < 3 && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
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
