
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useScrapeWebsite } from '@/hooks/useScrapeWebsite';
import { ScrapeStatus } from './ScrapeStatus';

export const UrlForm = () => {
  const [url, setUrl] = useState('');
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const { scrapeProgress, isLoading, startScraping } = useScrapeWebsite();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    // Add https:// if not included
    let processedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      processedUrl = `https://${url}`;
    }
    
    await startScraping(processedUrl);
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`form-input-container ${isUrlFocused ? 'ring-2 ring-primary/25' : ''}`}>
          <Input
            type="text"
            placeholder="Enter website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsUrlFocused(true)}
            onBlur={() => setIsUrlFocused(false)}
            className="form-input"
            disabled={isLoading || scrapeProgress.status === 'processing' || scrapeProgress.status === 'scanning'}
            autoComplete="off"
          />
          <span className="form-input-label">Website URL</span>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 transition-all duration-200 hover-scale"
          disabled={!url.trim() || isLoading || scrapeProgress.status === 'processing' || scrapeProgress.status === 'scanning'}
        >
          {isLoading || scrapeProgress.status === 'processing' || scrapeProgress.status === 'scanning' ? 
            'Processing...' : 'Scrape Website'}
        </Button>
      </form>
      
      {(scrapeProgress.status !== 'idle') && (
        <div className="mt-8 animate-fade-in">
          <ScrapeStatus progress={scrapeProgress} />
        </div>
      )}
    </div>
  );
};

export default UrlForm;
