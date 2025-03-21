
import { useState, useCallback } from 'react';
import { scrapeWebsite, ScrapeProgress, initialScrapeProgress } from '../utils/scraper';
import { chatbotService } from '../utils/chatbot';

export function useScrapeWebsite() {
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress>(initialScrapeProgress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  }, []);
  
  return {
    scrapeProgress,
    isLoading,
    error,
    startScraping,
  };
}
