
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';
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
      toast.error('Please enter a URL');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Normalize URL to ensure it has proper protocol
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      
      // Start the scraping process
      const result = await startScraping(normalizedUrl);
      
      // Once scraping is complete, update the chatbot's knowledge base
      if (result && result.content) {
        const knowledge = result.content.map(item => 
          `${item.title} - ${item.url}\n${item.content}`
        );
        chatbotService.updateKnowledgeBase(knowledge, normalizedUrl);
        
        console.log('Navigation triggered to scraped-site with URL:', normalizedUrl);
        
        // Navigate to the scraped site view
        navigate('/scraped-site', { state: { url: normalizedUrl } });
      } else {
        console.error('No content available after scraping');
        toast.error('Error processing website: No content could be extracted from this URL');
      }
    } catch (error) {
      console.error('Error scraping website:', error);
      toast.error('Error scraping website: Please try again with a valid URL');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isUrl = (value: string) => {
    if (!value) return false;
    
    // Add protocol if missing for validation
    const urlToCheck = value.startsWith('http') ? value : `https://${value}`;
    
    try {
      new URL(urlToCheck);
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
