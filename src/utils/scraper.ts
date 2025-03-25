
export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  links?: string[];
  timestamp?: string;
  status?: 'success' | 'error';
  message?: string;
}

export interface ScrapeProgress {
  totalUrls: number;
  processedUrls: number;
  progress: number;
  status: ScrapeStatus;
  results: ScrapeResult[];
  error?: string;
  websiteUrl?: string;
  content?: ScrapeResult[];
}

export type ScrapeStatus = 'idle' | 'in_progress' | 'scanning' | 'processing' | 'complete' | 'error';

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
  const mockTotalUrls = Math.floor(Math.random() * 8) + 3; // 3-10 URLs
  progress = {
    ...progress,
    status: 'processing',
    totalUrls: mockTotalUrls,
  };
  
  if (onProgress) onProgress(progress);
  
  // Generate more realistic mock data
  const mockResults: ScrapeResult[] = [];
  const domainName = new URL(url).hostname;
  
  // Define some realistic page types and content
  const pageTypes = [
    {
      path: '',
      title: 'Home',
      content: `Welcome to ${domainName}! We're a leading provider of AI-powered solutions for businesses. Our platform offers intelligent automation, data analysis, and machine learning capabilities to help you streamline operations and gain valuable insights. Explore our site to learn more about our products and services.`
    },
    {
      path: '/about',
      title: 'About Us',
      content: `About ${domainName}: Founded in 2020, we've been at the forefront of AI innovation. Our team of experts is dedicated to creating cutting-edge solutions that solve real-world problems. With a focus on user experience and technical excellence, we've helped hundreds of companies transform their operations through intelligent automation.`
    },
    {
      path: '/features',
      title: 'Features',
      content: `Our platform features include:\n\n1. AI-powered data analysis\n2. Natural language processing\n3. Automated workflow management\n4. Custom chatbot creation\n5. Seamless third-party integrations\n6. Advanced reporting and analytics\n\nAll features come with enterprise-grade security and dedicated support.`
    },
    {
      path: '/pricing',
      title: 'Pricing',
      content: `Our pricing plans:\n\nStarter: $29/month - Basic features for individuals and small teams\nPro: $99/month - Advanced features for growing businesses\nEnterprise: Contact us for custom pricing - Complete solution for large organizations\n\nAll plans include our core AI functionality, with different limits on usage and available features.`
    },
    {
      path: '/contact',
      title: 'Contact Us',
      content: `Get in touch with our team! You can reach us at support@${domainName} or call us at (555) 123-4567. Our office hours are Monday-Friday, 9am-5pm EST. We typically respond to all inquiries within 24 hours.`
    },
    {
      path: '/blog',
      title: 'Blog',
      content: `Latest articles:\n\n- The Future of AI in Business\n- How to Implement Chatbots Effectively\n- Case Study: How Company X Increased Efficiency by 40%\n- Understanding Machine Learning for Beginners\n- Top 10 AI Trends for 2023`
    },
    {
      path: '/faq',
      title: 'FAQ',
      content: `Frequently Asked Questions:\n\nQ: How easy is it to set up your platform?\nA: Our platform can be set up in minutes with our guided onboarding process.\n\nQ: Can I integrate with my existing tools?\nA: Yes, we offer integrations with most popular business tools and services.\n\nQ: Is my data secure?\nA: We use industry-leading encryption and security practices to protect all customer data.`
    },
    {
      path: '/testimonials',
      title: 'Testimonials',
      content: `"This platform has revolutionized how we handle customer support. Our response times are down 60%!" - John D., CEO\n\n"The AI capabilities have given us insights we never would have discovered otherwise." - Sarah M., CTO\n\n"Implementation was smooth and the results were immediate." - Michael R., Operations Director`
    },
    {
      path: '/docs',
      title: 'Documentation',
      content: `Getting Started Guide:\n\n1. Create your account\n2. Connect your data sources\n3. Configure your AI settings\n4. Build your first workflow\n5. Monitor and optimize\n\nCheck our detailed documentation for more information on each step.`
    },
    {
      path: '/privacy',
      title: 'Privacy Policy',
      content: `Privacy Policy: We take your privacy seriously. We collect only the data necessary to provide our services. We never sell your personal information to third parties. All data is encrypted in transit and at rest. You can request deletion of your data at any time.`
    }
  ];
  
  // Simulate processing each URL
  for (let i = 0; i < mockTotalUrls; i++) {
    // Simulate processing time per URL
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Select a page type from our list
    const pageIndex = i % pageTypes.length;
    const page = pageTypes[pageIndex];
    
    const mockResult: ScrapeResult = {
      url: `${url}${page.path}`,
      title: `${page.title} | ${domainName}`,
      content: page.content,
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
