export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UploadedFile {
  originalName: string;
  path: string;
  filename: string;
  size: number;
}

export interface Conversation {
  id: number;
  title: string;
  messages: Message[];
  createdAt: string;
}
