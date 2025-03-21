
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatWidget from '@/components/ChatWidget';
import { ArrowLeft } from 'lucide-react';

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
      setIsLoading(false);
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
  
  // Using a free public screenshot service without requiring API key
  const screenshotUrl = `https://api.urlbox.io/v1/screenshot?url=${encodeURIComponent(url)}&format=png&width=1200&height=800&force=true&full_page=true`;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          
          <div className="text-sm text-gray-500">
            Showing preview for: <span className="font-medium">{url}</span>
          </div>
        </div>
        
        <Card className="overflow-hidden border-2 shadow-xl h-[80vh]">
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
              <div className="relative w-full bg-gray-100 dark:bg-gray-800 min-h-[80vh]">
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                  Loading website preview...
                </div>
                <img
                  src={screenshotUrl}
                  alt="Website screenshot"
                  className="w-full object-contain"
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
        
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Support Bot Ready</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your support bot has been trained on content from <span className="font-medium">{url}</span>. 
            Click the chat button in the bottom right to ask questions about the website content.
          </p>
        </div>
      </div>
      
      {/* The chat widget will appear here */}
      <ChatWidget />
    </div>
  );
};

export default ScrapedSite;
