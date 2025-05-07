export interface ChatMessage {
  text: string;
  isUser: boolean;
}

export interface ChatResponse {
  content: string;
  role: "assistant" | "user" | "system";
}

export interface ChatRequest {
  messages: Array<{
    role: "assistant" | "user" | "system";
    content: string;
  }>;
  model: string;
  temperature?: number;
}

export interface VapiConfig {
  apiKey: string;
  assistant: {
    name: string;
    description: string;
  };
}
