
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useScrapeWebsite } from '@/hooks/useScrapeWebsite';
import { normalizeUrl, isValidUrl } from '@/utils/urlUtils';

const UrlForm = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { startScraping } = useScrapeWebsite(); 

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    const normalizedUrl = normalizeUrl(url);
    
    if (!isValidUrl(normalizedUrl)) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    setLoading(true);
    
    try {
      await startScraping(normalizedUrl);
      navigate('/scraped-site');
    } catch (error) {
      console.error('Scraping error:', error);
      toast.error('Failed to scrape website. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleScrape} className="w-full max-w-lg">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter your website URL (e.g. example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full h-12 text-base"
          />
        </div>
        <Button type="submit" disabled={loading} className="h-12 px-6">
          {loading ? 'Processing...' : 'Extract Knowledge'}
        </Button>
      </div>
    </form>
  );
};

export default UrlForm;
