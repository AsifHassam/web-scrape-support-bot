
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { scrapeWebsite, ScrapeProgress, initialScrapeProgress } from '../utils/scraper';
import { chatbotService } from '../utils/chatbot';

export function useScrapeWebsite() {
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress>(initialScrapeProgress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const startScraping = useCallback(async (url: string) => {
    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      toast.error("Invalid URL. Please enter a valid URL including http:// or https://");
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    setScrapeProgress(initialScrapeProgress);
    
    try {
      // Update progress as we go
      const progress = await scrapeWebsite(url, (progressUpdate) => {
        console.log("Scrape progress update:", progressUpdate);
        setScrapeProgress(progressUpdate);
      });
      
      // Extract content for the chatbot knowledge base
      if (progress.status === 'complete') {
        // Extract and process the content for the knowledge base
        const knowledge = progress.results.flatMap(result => {
          // Break content into paragraphs for more granular knowledge chunks
          const paragraphs = result.content.split('\n').filter(p => p.trim().length > 0);
          
          // Add title as a separate knowledge entry for better context
          const titleEntry = `${result.title} - ${result.url}`;
          
          return [titleEntry, ...(paragraphs.length > 0 ? paragraphs : [result.content])];
        });
        
        console.log(`Training chatbot with ${knowledge.length} knowledge entries for ${url}`);
        chatbotService.updateKnowledgeBase(knowledge, url);
        
        toast.success("Website scraped successfully! Bot is ready to answer questions.");
      }
      
      return progress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during scraping';
      console.error("Scraping error:", errorMessage);
      setError(errorMessage);
      setScrapeProgress({
        ...initialScrapeProgress,
        status: 'error',
        error: errorMessage,
      });
      
      toast.error("Failed to scrape website: " + errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);
  
  return {
    scrapeProgress,
    isLoading,
    error,
    startScraping,
  };
}
