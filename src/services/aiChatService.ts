
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
}

class AIChatService {
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  async sendMessage(message: string, sessionId: string): Promise<ChatResponse> {
    try {
      // Get conversation history
      const history = this.conversationHistory.get(sessionId) || [];
      
      // Simulate AI response for local mode
      const response = this.generateLocalResponse();
      
      // Update conversation history
      const updatedHistory = [
        ...history,
        { role: 'user' as const, content: message, timestamp: new Date().toISOString() },
        { role: 'assistant' as const, content: response, timestamp: new Date().toISOString() }
      ];
      
      this.conversationHistory.set(sessionId, updatedHistory);

      return {
        success: true,
        response
      };
    } catch (error) {
      console.error('Chat error:', error);
      return {
        success: false,
        error: 'Failed to process message'
      };
    }
  }

  clearConversationHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
  }

  private generateLocalResponse(): string {
    const responses = [
      "I understand your question. How can I help you further?",
      "That's an interesting point. Let me think about that...",
      "I appreciate you sharing that with me. What would you like to know next?",
      "Thanks for the message! I'm here to assist you.",
      "I see what you're asking about. Let me provide some guidance."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

export const aiChatService = new AIChatService();
