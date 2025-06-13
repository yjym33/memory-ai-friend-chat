import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entity/conversation.entity';
import { Repository } from 'typeorm';

/**
 * 채팅 관련 비즈니스 로직을 처리하는 서비스
 * 대화의 CRUD 작업을 담당합니다.
 */
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  /**
   * 대화 제목을 업데이트합니다.
   * @param id - 대화 ID
   * @param title - 새로운 제목
   * @returns 업데이트된 대화 객체
   * @throws NotFoundException - 대화를 찾을 수 없는 경우
   */
  async updateConversationTitle(
    id: number,
    title: string,
  ): Promise<Conversation> {
    const conversation = await this.getConversation(id);
    if (!conversation) {
      throw new NotFoundException(`ID ${id}인 대화를 찾을 수 없습니다.`);
    }
    await this.conversationRepository.update(id, { title });
    return this.getConversation(id);
  }

  /**
   * 새로운 대화를 생성합니다.
   * @param userId - 사용자 ID
   * @returns 생성된 대화 객체
   */
  async createConversation(userId: string): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      messages: [],
      userId: userId,
    });
    return this.conversationRepository.save(conversation);
  }

  /**
   * 특정 대화를 조회합니다.
   * @param id - 대화 ID
   * @returns 대화 객체
   */
  async getConversation(id: number): Promise<Conversation> {
    return this.conversationRepository.findOne({ where: { id } });
  }

  /**
   * 사용자의 모든 대화를 조회합니다.
   * @param userId - 사용자 ID
   * @returns 대화 객체 배열 (생성일 기준 내림차순)
   */
  async getAllConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 대화 내용을 업데이트합니다.
   * @param id - 대화 ID
   * @param messages - 새로운 메시지 배열
   * @returns 업데이트된 대화 객체
   */
  async updateConversation(id: number, messages: any[]): Promise<Conversation> {
    await this.conversationRepository.update(id, { messages });
    return this.getConversation(id);
  }

  /**
   * 대화를 삭제합니다.
   * @param id - 대화 ID
   * @throws NotFoundException - 대화를 찾을 수 없는 경우
   */
  async deleteConversation(id: number): Promise<void> {
    const result = await this.conversationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ID ${id}인 대화를 찾을 수 없습니다.`);
    }
  }

  /**
   * 대화의 고정 상태를 업데이트합니다.
   * @param id - 대화 ID
   * @param pinned - 고정 상태
   * @returns 업데이트된 대화 객체
   * @throws NotFoundException - 대화를 찾을 수 없는 경우
   */
  async updateConversationPin(
    id: number,
    pinned: boolean,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOneBy({ id });
    if (!conversation) {
      throw new NotFoundException('대화를 찾을 수 없습니다.');
    }
    conversation.pinned = pinned;
    await this.conversationRepository.save(conversation);
    return conversation;
  }
}
