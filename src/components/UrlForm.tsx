
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import useScrapeWebsite from '@/hooks/useScrapeWebsite';
import ScrapeStatus from '@/components/ScrapeStatus';
import { chatbotService } from '@/utils/chatbot';

const UrlForm = () => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { scrapeProgress, startScraping } = useScrapeWebsite();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: 'Please enter a URL',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Start the scraping process
      await startScraping(url);
      
      // Once scraping is complete, update the chatbot's knowledge base
      if (scrapeProgress.content) {
        const knowledge = scrapeProgress.content.map(item => 
          `${item.title} - ${item.url}\n${item.content}`
        );
        chatbotService.updateKnowledgeBase(knowledge, url);
        
        // Navigate to the scraped site view
        navigate('/scraped-site', { state: { url } });
      }
    } catch (error) {
      console.error('Error scraping website:', error);
      toast({
        title: 'Error scraping website',
        description: 'Please try again with a valid URL',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  return (
    <div className="w-full max-w-2xl space-y-4">
      <form onSubmit={handleSubmit} className="flex w-full space-x-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Enter website URL (e.g., example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pr-10 h-12 text-base"
            disabled={isSubmitting}
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="h-12 px-6"
          disabled={isSubmitting || !isUrl(url)}
        >
          {isSubmitting ? 'Processing...' : 'Analyze'}
        </Button>
      </form>
      
      {(scrapeProgress.status !== 'idle') && (
        <ScrapeStatus progress={scrapeProgress} />
      )}
    </div>
  );
};

export default UrlForm;
