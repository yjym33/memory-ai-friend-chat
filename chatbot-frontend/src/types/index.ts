export interface UploadedFile {
  originalName: string;
  path: string;
  filename: string;
  size: number;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Conversation {
  id: number;
  title: string;
  messages: Message[];
  createdAt: string;
}
