
export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  links: string[];
  timestamp: string;
  status: 'success' | 'error';
  message?: string;
}

export interface ScrapeProgress {
  totalUrls: number;
  processedUrls: number;
  progress: number;
  status: 'idle' | 'scanning' | 'processing' | 'complete' | 'error';
  results: ScrapeResult[];
  error?: string;
}

export const initialScrapeProgress: ScrapeProgress = {
  totalUrls: 0,
  processedUrls: 0,
  progress: 0,
  status: 'idle',
  results: [],
};

// This is a mock function that would be replaced with actual scraping logic
// In a real implementation, this would connect to a backend API
export const scrapeWebsite = async (url: string, 
  onProgress?: (progress: ScrapeProgress) => void): Promise<ScrapeProgress> => {
  
  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    return {
      ...initialScrapeProgress,
      status: 'error',
      error: 'Invalid URL. Please enter a valid URL including http:// or https://',
    };
  }
  
  // Mock implementation for demo purposes
  // In a real app, this would make API calls to a backend service
  
  // Initialize progress
  let progress: ScrapeProgress = {
    ...initialScrapeProgress,
    status: 'scanning',
    totalUrls: 0,
    processedUrls: 0,
    progress: 0,
  };
  
  if (onProgress) onProgress(progress);
  
  // Simulate scanning for links
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Update with mock total URLs found
  const mockTotalUrls = Math.floor(Math.random() * 15) + 5; // 5-20 URLs
  progress = {
    ...progress,
    status: 'processing',
    totalUrls: mockTotalUrls,
  };
  
  if (onProgress) onProgress(progress);
  
  // Simulate processing each URL
  const mockResults: ScrapeResult[] = [];
  
  for (let i = 0; i < mockTotalUrls; i++) {
    // Simulate processing time per URL
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockPagePath = i === 0 ? '' : `/page-${i}`;
    const mockResult: ScrapeResult = {
      url: `${url}${mockPagePath}`,
      title: `${i === 0 ? 'Home' : `Page ${i}`} | ${new URL(url).hostname}`,
      content: `This is the ${i === 0 ? 'main' : `${i}th`} page of the website. It contains information about the product, services, and other details.`,
      links: [],
      timestamp: new Date().toISOString(),
      status: 'success',
    };
    
    mockResults.push(mockResult);
    
    progress = {
      ...progress,
      processedUrls: i + 1,
      progress: (i + 1) / mockTotalUrls,
      results: [...mockResults],
    };
    
    if (onProgress) onProgress(progress);
  }
  
  // Complete the scraping process
  progress = {
    ...progress,
    status: 'complete',
    progress: 1,
  };
  
  if (onProgress) onProgress(progress);
  
  return progress;
};
