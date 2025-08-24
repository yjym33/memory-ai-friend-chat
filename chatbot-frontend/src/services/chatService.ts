import { Conversation, Message } from "../types";
import { BaseService } from "./baseService";

export class ChatService extends BaseService {
  /**
   * 모든 대화 목록 조회
   */
  static async getConversations(): Promise<Conversation[]> {
    return BaseService.get<Conversation[]>("/chat/conversations");
  }

  /**
   * 특정 대화 조회
   */
  static async getConversation(conversationId: number): Promise<Conversation> {
    return BaseService.get<Conversation>(
      `/chat/conversations/${conversationId}`
    );
  }

  /**
   * 새 대화 생성
   */
  static async createConversation(): Promise<Conversation> {
    return BaseService.post<Conversation>("/chat/conversations");
  }

  /**
   * 메시지 전송
   */
  static async sendMessage(
    conversationId: number,
    message: string
  ): Promise<Message> {
    return BaseService.post<Message>(`/chat/completion/${conversationId}`, {
      message,
    });
  }

  /**
   * 대화 제목 수정
   */
  static async updateConversationTitle(
    conversationId: number,
    title: string
  ): Promise<Conversation> {
    return BaseService.patch<Conversation>(
      `/chat/conversations/${conversationId}`,
      {
        title,
      }
    );
  }

  /**
   * 대화 고정/해제
   */
  static async toggleConversationPin(
    conversationId: number
  ): Promise<Conversation> {
    return BaseService.patch<Conversation>(
      `/chat/conversations/${conversationId}/pin`
    );
  }

  /**
   * 대화 삭제
   */
  static async deleteConversation(conversationId: number): Promise<void> {
    await BaseService.delete<void>(`/chat/conversations/${conversationId}`);
  }
}
