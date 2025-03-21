
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatWidget from '@/components/ChatWidget';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import KnowledgeBase from '@/components/KnowledgeBase';
import { chatbotService } from '@/utils/chatbot';

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
  
  // Using a reliable screenshot API service
  const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=SCREENSHOT9GS7OY&url=${encodeURIComponent(url)}&width=1920&height=1080&full_page=true&output=image&file_type=png&wait_for_page_load=true`;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto p-0 sm:p-0 md:p-0 lg:p-0 h-screen flex flex-col">
        <div className="fixed bottom-24 right-24 z-10 flex flex-col gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="rounded-full shadow-lg hover:shadow-xl" 
                size="icon"
              >
                <BookOpen className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh]">
              <DialogHeader>
                <DialogTitle>Knowledge Base from {url}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-full mt-4">
                <KnowledgeBase scrapeResult={chatbotService.getKnowledgeData()} />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
        
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
    </div>
  );
};

export default ScrapedSite;
