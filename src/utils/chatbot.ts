
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
  }
  
  public async sendMessage(message: string): Promise<ChatMessage> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.responseDelay));
    
    // Generate a simple response based on the message
    let response = "I'm sorry, I don't have enough information to answer that question.";
    
    const lowerMessage = message.toLowerCase();
    
    // Simple pattern matching for demo purposes
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      response = "Hello! How can I help you today?";
    } else if (lowerMessage.includes("help")) {
      response = "I'm here to help! You can ask me questions about the website I was trained on.";
    } else if (lowerMessage.includes("who are you") || lowerMessage.includes("what are you")) {
      response = "I'm a support bot trained on the content from the website you provided. I can answer questions based on that information.";
    } else if (this.knowledgeBase.length > 0) {
      // Find a relevant response from the knowledge base
      for (const knowledge of this.knowledgeBase) {
        if (knowledge.toLowerCase().includes(lowerMessage)) {
          response = `Based on the website content: ${knowledge}`;
          break;
        }
      }
    }
    
    return {
      id: Date.now().toString(),
      role: 'bot',
      content: response,
      timestamp: new Date(),
    };
  }
}

// Initialize a global instance that can be imported anywhere
export const chatbotService = new ChatbotService();
