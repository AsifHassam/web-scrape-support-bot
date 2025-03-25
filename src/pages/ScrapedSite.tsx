
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatWidget from '@/components/ChatWidget';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import KnowledgeBase from '@/components/KnowledgeBase';
import { chatbotService } from '@/utils/chatbot';
import { ScrapeProgress } from '@/utils/scraper';

interface LocationState {
  url: string;
}

const ScrapedSite = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [screenshotError, setScreenshotError] = useState(false);
  const { url } = (location.state as LocationState) || { url: '' };
  
  useEffect(() => {
    // If no URL was provided in the state, redirect back to home
    if (!url) {
      navigate('/');
    } else {
      // Give some time for the screenshot to load
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [url, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3">Loading preview...</span>
      </div>
    );
  }
  
  // Using the original screenshot method
  const screenshotUrl = `https://image.thum.io/get/width/1920/crop/900/maxAge/1/noanimate/https://${url.replace(/^https?:\/\//, '')}`;
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="fixed top-4 left-4 z-10">
        <Button 
          variant="outline"
          size="sm"
          className="bg-white dark:bg-gray-800 shadow-sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>
      
      <div className="fixed top-4 right-4 z-10 flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline"
              size="sm"
              className="bg-white dark:bg-gray-800 shadow-sm flex items-center"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Knowledge Base
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>Knowledge Base from {url}</DialogTitle>
              <DialogDescription>
                This shows all the content extracted from the website that the chatbot has been trained on.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-full mt-4">
              {/* Cast the knowledge data to any to resolve the type mismatch issue */}
              <KnowledgeBase scrapeResult={chatbotService.getKnowledgeData() as any} />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="container mx-auto p-0 h-screen flex flex-col">
        <Card className="flex-1 overflow-hidden border-none shadow-none rounded-none">
          <ScrollArea className="h-full w-full">
            {screenshotError ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <p className="text-red-500 mb-4">Failed to load screenshot</p>
                <p className="text-gray-600 max-w-md">
                  We couldn't load a screenshot of {url}. You can still use the chatbot
                  to ask questions about the website content.
                </p>
              </div>
            ) : (
              <div className="relative w-full min-h-screen">
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                  Loading website preview...
                </div>
                <img
                  src={screenshotUrl}
                  alt="Website screenshot"
                  className="w-full h-auto object-contain"
                  onLoad={() => {
                    console.log("Screenshot loaded successfully");
                  }}
                  onError={(e) => {
                    console.error("Error loading screenshot", e);
                    setScreenshotError(true);
                  }}
                />
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
      
      {/* The chat widget will appear here */}
      <ChatWidget />
      
      <div className="fixed bottom-24 right-6 z-10 pointer-events-none flex flex-col items-end">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg mb-2 pointer-events-auto opacity-80 hover:opacity-100 transition-opacity">
          <p className="text-xs text-gray-500">Your AI assistant is ready!</p>
          <p className="text-sm font-medium">Ask questions about {url}</p>
        </div>
      </div>
    </div>
  );
};

export default ScrapedSite;
