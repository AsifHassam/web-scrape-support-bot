
import { ScrapeProgress } from '@/utils/scraper';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface ScrapeStatusProps {
  progress: ScrapeProgress;
}

export const ScrapeStatus = ({ progress }: ScrapeStatusProps) => {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
      case 'scanning':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'idle':
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const getStatusText = () => {
    switch (progress.status) {
      case 'complete':
        return 'Scraping complete!';
      case 'error':
        return 'Error occurred';
      case 'processing':
        return 'Processing pages...';
      case 'scanning':
        return 'Scanning website...';
      case 'idle':
      default:
        return 'Ready to begin';
    }
  };
  
  const getStatusDescription = () => {
    switch (progress.status) {
      case 'complete':
        return `Successfully processed ${progress.processedUrls} pages. Knowledge base is ready for use.`;
      case 'error':
        return progress.error || 'An unknown error occurred while scraping the website.';
      case 'processing':
        return `Processed ${progress.processedUrls} of ${progress.totalUrls} pages.`;
      case 'scanning':
        return 'Analyzing website structure and discovering pages...';
      case 'idle':
      default:
        return 'Enter a URL to begin scraping.';
    }
  };
  
  return (
    <div className="space-y-4">
      <Alert className="border-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <AlertTitle>{getStatusText()}</AlertTitle>
        </div>
        <AlertDescription>
          {getStatusDescription()}
        </AlertDescription>
      </Alert>
      
      {(progress.status === 'processing' || progress.status === 'scanning') && (
        <div className="space-y-2">
          <Progress 
            value={progress.status === 'scanning' ? undefined : progress.progress * 100} 
            className={progress.status === 'scanning' ? 'animate-pulse' : ''} 
          />
          <p className="text-sm text-gray-500 text-right">
            {progress.status === 'scanning' ? 'Scanning...' : `${Math.round(progress.progress * 100)}%`}
          </p>
        </div>
      )}
      
      {progress.status === 'complete' && progress.results.length > 0 && (
        <div className="mt-4 space-y-4">
          <h3 className="text-lg font-medium">Scraped Pages</h3>
          <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200">
            <ul className="divide-y divide-gray-200">
              {progress.results.map((result, index) => (
                <li key={index} className="p-3 text-sm hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-gray-900 truncate">{result.title}</p>
                  <p className="text-gray-500 truncate text-xs">{result.url}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrapeStatus;
