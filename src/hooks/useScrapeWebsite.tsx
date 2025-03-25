
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { scrapeWebsite, ScrapeProgress, initialScrapeProgress } from '../utils/scraper';
import { chatbotService } from '../utils/chatbot';
import { supabase } from '@/integrations/supabase/client';

export function useScrapeWebsite() {
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress>(initialScrapeProgress);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const startScraping = useCallback(async (url: string, botId?: string) => {
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
        
        // Update the knowledge base with the URL as identifier
        chatbotService.updateKnowledgeBase(knowledge, url);
        
        // If botId is provided, store the knowledge source in the database
        if (botId) {
          try {
            // Check if this URL already exists as a source for this bot
            const { data: existingSources } = await supabase
              .from('knowledge_sources')
              .select('*')
              .eq('bot_id', botId)
              .eq('source_type', 'website')
              .eq('content', url);
            
            if (!existingSources || existingSources.length === 0) {
              // Add new knowledge source
              await supabase
                .from('knowledge_sources')
                .insert({
                  bot_id: botId,
                  source_type: 'website',
                  content: url
                });
            }
          } catch (dbError) {
            console.error("Error saving knowledge source:", dbError);
            // Continue execution even if saving to DB fails
          }
        }
        
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
