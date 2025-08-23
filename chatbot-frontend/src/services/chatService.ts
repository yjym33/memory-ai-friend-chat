import axiosInstance from "../utils/axios";
import { Conversation, Message } from "../types";

export class ChatService {
  /**
   * 모든 대화 목록 조회
   */
  static async getConversations(): Promise<Conversation[]> {
    const response = await axiosInstance.get<Conversation[]>(
      "/chat/conversations"
    );
    return response.data;
  }

  /**
   * 특정 대화 조회
   */
  static async getConversation(conversationId: number): Promise<Conversation> {
    const response = await axiosInstance.get<Conversation>(
      `/chat/conversations/${conversationId}`
    );
    return response.data;
  }

  /**
   * 새 대화 생성
   */
  static async createConversation(): Promise<Conversation> {
    const response = await axiosInstance.post<Conversation>(
      "/chat/conversations"
    );
    return response.data;
  }

  /**
   * 메시지 전송
   */
  static async sendMessage(
    conversationId: number,
    message: string
  ): Promise<Message> {
    const response = await axiosInstance.post<Message>(
      `/chat/completion/${conversationId}`,
      { message }
    );
    return response.data;
  }

  /**
   * 대화 제목 수정
   */
  static async updateConversationTitle(
    conversationId: number,
    title: string
  ): Promise<Conversation> {
    const response = await axiosInstance.patch<Conversation>(
      `/chat/conversations/${conversationId}`,
      { title }
    );
    return response.data;
  }

  /**
   * 대화 고정/해제
   */
  static async toggleConversationPin(
    conversationId: number
  ): Promise<Conversation> {
    const response = await axiosInstance.patch<Conversation>(
      `/chat/conversations/${conversationId}/pin`
    );
    return response.data;
  }

  /**
   * 대화 삭제
   */
  static async deleteConversation(conversationId: number): Promise<void> {
    await axiosInstance.delete(`/chat/conversations/${conversationId}`);
  }
}
