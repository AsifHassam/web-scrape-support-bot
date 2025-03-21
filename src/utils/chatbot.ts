export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

import { ScrapeResult as ScraperResult } from './scraper';

// Define a compatible type that matches what KnowledgeBase expects
export interface ScrapeResult {
  status: 'complete';
  results: {
    url: string;
    title: string;
    content: string;
  }[];
}

// This is a mock implementation that simulates a chatbot
// In a real application, this would connect to an AI backend
export class ChatbotService {
  private knowledgeBase: string[];
  private responseDelay: number = 500; // ms
  private websiteUrl: string | null = null;
  private knowledgeData: ScrapeResult = {
    status: 'complete',
    results: []
  };
  
  constructor(knowledge: string[] = []) {
    this.knowledgeBase = knowledge;
    console.log("ChatbotService initialized with knowledge entries:", knowledge.length);
  }
  
  public updateKnowledgeBase(knowledge: string[], websiteUrl?: string): void {
    this.knowledgeBase = knowledge;
    if (websiteUrl) {
      this.websiteUrl = websiteUrl;
    }
    console.log(`Knowledge base updated with ${knowledge.length} entries for website: ${this.websiteUrl || 'unknown'}`);
    
    // Store structured data for display in the knowledge base
    this.knowledgeData = {
      status: 'complete',
      results: this.structureKnowledge(knowledge)
    };
    
    // Log a sample of the knowledge to validate content
    if (knowledge.length > 0) {
      console.log("Knowledge sample:", knowledge.slice(0, 3));
    }
  }
  
  private structureKnowledge(knowledge: string[]): { url: string, title: string, content: string }[] {
    // For demonstration, we'll structure the flat knowledge list into page-like components
    const structured: { url: string, title: string, content: string }[] = [];
    
    // Group knowledge items into "pages"
    let currentTitle = '';
    let currentContent: string[] = [];
    
    knowledge.forEach((item, index) => {
      // Check if this looks like a title/URL entry (they were combined earlier)
      if (item.includes(' - http') || item.includes(' - https')) {
        // If we have a previous title and content, add it to the result
        if (currentTitle && currentContent.length > 0) {
          structured.push({
            url: this.websiteUrl || '',
            title: currentTitle,
            content: currentContent.join('\n')
          });
        }
        
        // Start a new page
        const parts = item.split(' - ');
        currentTitle = parts[0];
        currentContent = [];
      } else {
        // Add content to the current page
        currentContent.push(item);
      }
    });
    
    // Add the last page if there is one
    if (currentTitle && currentContent.length > 0) {
      structured.push({
        url: this.websiteUrl || '',
        title: currentTitle,
        content: currentContent.join('\n')
      });
    }
    
    // If no structured data was created, make a single generic entry
    if (structured.length === 0 && knowledge.length > 0) {
      structured.push({
        url: this.websiteUrl || '',
        title: 'Website Content',
        content: knowledge.join('\n')
      });
    }
    
    return structured;
  }
  
  public getKnowledgeData(): ScrapeResult {
    return this.knowledgeData;
  }
  
  public async sendMessage(message: string): Promise<ChatMessage> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.responseDelay));
    
    console.log("Processing user message:", message);
    console.log("Knowledge base size:", this.knowledgeBase.length);
    
    // Generate a response based on the knowledge base and user message
    let response = this.findRelevantResponse(message);
    
    return {
      id: Date.now().toString(),
      role: 'bot',
      content: response,
      timestamp: new Date(),
    };
  }

  private findRelevantResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Handle greeting patterns
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return `Hello! I'm your support bot for ${this.websiteUrl || 'this website'}. How can I help you today?`;
    } 
    
    // Handle self-identification questions
    if (lowerMessage.includes("who are you") || lowerMessage.includes("what are you")) {
      return `I'm a support bot trained on the content from ${this.websiteUrl || 'the website you provided'}. I can answer questions based on that information.`;
    }
    
    // If knowledge base is empty, provide a fallback response
    if (!this.knowledgeBase || this.knowledgeBase.length === 0) {
      return "I don't have any information to work with yet. Please try scraping the website again.";
    }

    // Tokenize the message into meaningful words for better matching
    const messageWords = lowerMessage
      .replace(/[.,?!;:()"'-]/g, ' ')  // Remove punctuation
      .split(/\s+/)                    // Split by whitespace
      .filter(word => word.length > 2 && !this.isStopWord(word)); // Remove stop words and very short words
    
    console.log("Searching for keywords:", messageWords);
    
    if (messageWords.length === 0) {
      return `I need more specific information to help you. What would you like to know about ${this.websiteUrl || 'this website'}?`;
    }
    
    // Calculate relevance scores for each knowledge entry
    const scoredContent = this.knowledgeBase.map(content => {
      const lowerContent = content.toLowerCase();
      let score = 0;
      
      // Score based on exact keyword matches
      messageWords.forEach(word => {
        if (lowerContent.includes(word)) {
          score += 1;
        }
      });
      
      return { content, score };
    });
    
    // Sort by relevance score (highest first)
    scoredContent.sort((a, b) => b.score - a.score);
    
    // Get the top relevant pieces (those with any matches)
    const relevantPieces = scoredContent
      .filter(item => item.score > 0)
      .map(item => item.content);
    
    console.log(`Found ${relevantPieces.length} relevant pieces of content`);
    
    // Construct the response
    if (relevantPieces.length > 0) {
      // For demo purposes, just return the highest scoring relevant content
      // In a real implementation, we would use an LLM to synthesize a coherent answer
      return `Based on the website content: ${relevantPieces[0]}`;
    }
    
    return `I couldn't find specific information about that in the content from ${this.websiteUrl || 'the website'}. Is there something else I can help with?`;
  }
  
  // Simple list of English stop words
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'is', 'in', 'it', 'to', 'of', 'for', 'with', 'on', 'at', 'from', 
      'by', 'about', 'as', 'an', 'are', 'be', 'been', 'being', 'was', 'were', 'will', 
      'would', 'should', 'can', 'could', 'may', 'might', 'must', 'shall', 'that', 'this', 
      'these', 'those', 'then', 'than', 'there', 'their', 'they', 'them', 'what', 'when', 
      'where', 'which', 'who', 'whom', 'whose', 'how', 'why'
    ]);
    return stopWords.has(word);
  }
}

// Initialize a global instance that can be imported anywhere
export const chatbotService = new ChatbotService();
