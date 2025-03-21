
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { scrapeWebsite, ScrapeProgress, initialScrapeProgress } from '../utils/scraper';
import { chatbotService } from '../utils/chatbot';

export function useScrapeWebsite() {
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress>(initialScrapeProgress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const startScraping = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setScrapeProgress(initialScrapeProgress);
    
    try {
      const progress = await scrapeWebsite(url, (progress) => {
        setScrapeProgress(progress);
      });
      
      // Extract content for the chatbot knowledge base
      if (progress.status === 'complete') {
        const knowledge = progress.results.map(result => result.content);
        chatbotService.updateKnowledgeBase(knowledge);
        
        // Navigate to the scraped site page with the URL as state
        navigate('/scraped-site', { state: { url } });
      }
      
      return progress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setScrapeProgress({
        ...initialScrapeProgress,
        status: 'error',
        error: errorMessage,
      });
      
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
