import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entity/conversation.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

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

  async createConversation(userId: string): Promise<Conversation> {
    const conversation = this.conversationRepository.create({
      messages: [],
      userId: userId,
    });
    return this.conversationRepository.save(conversation);
  }

  async getConversation(id: number): Promise<Conversation> {
    return this.conversationRepository.findOne({ where: { id } });
  }

  async getAllConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateConversation(id: number, messages: any[]): Promise<Conversation> {
    await this.conversationRepository.update(id, { messages });
    return this.getConversation(id);
  }

  async deleteConversation(id: number): Promise<void> {
    const result = await this.conversationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ID ${id}인 대화를 찾을 수 없습니다.`);
    }
  }

  async updateConversationPin(id: number, pinned: boolean) {
    const conversation = await this.conversationRepository.findOneBy({ id });
    if (!conversation) throw new NotFoundException('Conversation not found');
    conversation.pinned = pinned;
    await this.conversationRepository.save(conversation);
    return conversation;
  }
}
