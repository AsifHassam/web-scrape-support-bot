
import { useState, useCallback } from 'react';
import { ScrapeProgress, ScrapeStatus, initialScrapeProgress } from '@/utils/scraper';
import { normalizeUrl } from '@/utils/urlUtils';

export const useScrapeWebsite = () => {
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress>(initialScrapeProgress);

  const startScraping = useCallback(async (websiteUrl: string) => {
    try {
      // Reset progress
      setScrapeProgress(initialScrapeProgress);
      
      // Ensure URL has proper protocol
      const normalizedUrl = normalizeUrl(websiteUrl);
      
      // Update status to indicate scraping has started
      setScrapeProgress(prev => ({ 
        ...prev, 
        status: 'in_progress' as ScrapeStatus,
        websiteUrl: normalizedUrl,
        progress: 0.1,
        totalUrls: 1,
        processedUrls: 0
      }));
      
      // Simulate scraping with incremental progress updates
      for (let i = 1; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setScrapeProgress(prev => ({
          ...prev,
          progress: Math.min(0.1 + (i * 0.09), 1),
          processedUrls: Math.floor(i * 0.7),
          totalUrls: 7
        }));
      }
      
      // Indicate scraping is complete
      setScrapeProgress(prev => ({
        ...prev,
        status: 'complete',
        progress: 1,
        processedUrls: 7,
        totalUrls: 7,
        content: [
          { title: 'Homepage', content: 'Extracted homepage content...', url: `${normalizedUrl}` },
          { title: 'About Us', content: 'Extracted about us content...', url: `${normalizedUrl}/about` },
          { title: 'Products', content: 'Extracted products content...', url: `${normalizedUrl}/products` },
          { title: 'Services', content: 'Extracted services content...', url: `${normalizedUrl}/services` },
          { title: 'FAQ', content: 'Extracted FAQ content...', url: `${normalizedUrl}/faq` },
          { title: 'Contact', content: 'Extracted contact content...', url: `${normalizedUrl}/contact` },
          { title: 'Blog', content: 'Extracted blog content...', url: `${normalizedUrl}/blog` },
        ]
      }));
      
    } catch (error) {
      console.error('Error scraping website:', error);
      setScrapeProgress(prev => ({
        ...prev,
        status: 'error',
        error: 'Failed to scrape website'
      }));
      throw error;
    }
  }, []);

  return { scrapeProgress, startScraping };
};

export default useScrapeWebsite;
