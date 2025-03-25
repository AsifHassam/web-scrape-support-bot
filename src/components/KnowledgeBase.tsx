
import { useState } from 'react';
import { ScrapeProgress, ScrapeResult } from '@/utils/scraper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy } from 'lucide-react';

interface KnowledgeBaseProps {
  scrapeResult: ScrapeProgress | ScrapeResult | any;
}

export const KnowledgeBase = ({ scrapeResult }: KnowledgeBaseProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  
  // Extract the results array from either ScrapeProgress or ScrapeResult
  const results = 'results' in scrapeResult ? scrapeResult.results : [];
  
  const copyContent = () => {
    const content = results
      .map(result => `${result.title}\n${result.url}\n${result.content}\n`)
      .join('\n');
    
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!results.length) {
    return (
      <Card className="w-full overflow-hidden border-2 shadow-lg glass-card">
        <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Knowledge Base</CardTitle>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              Empty
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No knowledge entries available. Add content to build your knowledge base.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full overflow-hidden border-2 shadow-lg glass-card">
      <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Knowledge Base</CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Ready
          </Badge>
        </div>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 border-b">
          <TabsList className="grid w-full grid-cols-3 my-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="overview" className="p-6 space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Pages Scraped</p>
                <p className="text-3xl font-bold">{results.length}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Content Size</p>
                <p className="text-3xl font-bold">
                  {Math.round(results.reduce((acc, curr) => acc + curr.content.length, 0) / 1024)} KB
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Summary</h3>
              <p className="text-sm text-gray-500">
                Your knowledge base is ready to use. The chat support widget has been updated with this information
                and can now answer questions about your website content.
              </p>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center space-x-2"
              onClick={copyContent}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy All Content</span>
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="pages" className="mt-0">
            <ul className="divide-y">
              {results.map((result, index) => (
                <li key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex flex-col">
                    <span className="font-medium text-primary hover:underline">{result.title}</span>
                    <span className="text-xs text-gray-500 truncate">{result.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          </TabsContent>
          
          <TabsContent value="content" className="mt-0">
            <div className="max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="p-4 border-b">
                  <h3 className="font-medium">{result.title}</h3>
                  <p className="text-xs text-gray-500 mb-2">{result.url}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{result.content}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default KnowledgeBase;
