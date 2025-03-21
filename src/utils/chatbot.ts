
export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// This is a mock implementation that simulates a chatbot
// In a real application, this would connect to an AI backend
export class ChatbotService {
  private knowledgeBase: string[];
  private responseDelay: number = 500; // ms
  
  constructor(knowledge: string[] = []) {
    this.knowledgeBase = knowledge;
  }
  
  public updateKnowledgeBase(knowledge: string[]): void {
    this.knowledgeBase = knowledge;
    console.log("Knowledge base updated with entries:", knowledge.length);
  }
  
  public async sendMessage(message: string): Promise<ChatMessage> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.responseDelay));
    
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
      return "Hello! How can I help you today?";
    } 
    
    // Handle self-identification questions
    if (lowerMessage.includes("who are you") || lowerMessage.includes("what are you")) {
      return "I'm a support bot trained on the content from the website you provided. I can answer questions based on that information.";
    }
    
    // If knowledge base is empty, provide a fallback response
    if (!this.knowledgeBase || this.knowledgeBase.length === 0) {
      return "I don't have any information to work with yet. Please try scraping the website again.";
    }

    // Search for relevant information in the knowledge base
    const relevantPieces: string[] = [];
    const messageWords = lowerMessage.split(/\s+/);
    
    // Find relevant content based on keyword matching
    for (const content of this.knowledgeBase) {
      const lowerContent = content.toLowerCase();
      
      // Check if any significant word from the query appears in the content
      const hasRelevantKeywords = messageWords
        .filter(word => word.length > 3) // Only consider significant words
        .some(word => lowerContent.includes(word));
      
      if (hasRelevantKeywords) {
        relevantPieces.push(content);
      }
    }
    
    // Construct the response
    if (relevantPieces.length > 0) {
      // Get a random piece of relevant content
      const randomIndex = Math.floor(Math.random() * relevantPieces.length);
      return `Based on the website content: ${relevantPieces[randomIndex]}`;
    }
    
    return "I couldn't find specific information about that in the website content. Is there something else I can help with?";
  }
}

// Initialize a global instance that can be imported anywhere
export const chatbotService = new ChatbotService();
