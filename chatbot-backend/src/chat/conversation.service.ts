import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entity/conversation.entity';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  async createConversation(userId: string): Promise<Conversation> {
    this.logger.debug(`[createConversation] 호출 - userId: ${userId}`);
    const conversation = this.conversationRepository.create({
      messages: [],
      userId: userId,
    });
    const result = await this.conversationRepository.save(conversation);
    this.logger.debug(
      `[createConversation] 완료 - userId: ${userId}, conversationId: ${result.id}`,
    );
    return result;
  }

  async getConversation(id: number): Promise<Conversation | null> {
    return this.conversationRepository.findOne({ where: { id } });
  }

  async getAllConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateConversationTitle(id: number, title: string): Promise<Conversation> {
    await this.conversationRepository.update(id, { title });
    const updated = await this.getConversation(id);
    if (!updated) throw new NotFoundException('대화를 찾을 수 없습니다.');
    return updated;
  }

  async updateConversation(
    id: number,
    messages: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<Conversation> {
    await this.conversationRepository.update(id, { messages });
    const updated = await this.getConversation(id);
    if (!updated) throw new NotFoundException('대화를 찾을 수 없습니다.');
    return updated;
  }

  async deleteConversation(id: number): Promise<void> {
    const result = await this.conversationRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('대화를 찾을 수 없습니다.');
    }
  }

  async updateConversationPin(id: number, pinned: boolean): Promise<Conversation> {
    await this.conversationRepository.update(id, { pinned });
    const updated = await this.getConversation(id);
    if (!updated) throw new NotFoundException('대화를 찾을 수 없습니다.');
    return updated;
  }

  async updateConversationArchive(id: number, archived: boolean): Promise<Conversation> {
    await this.conversationRepository.update(id, { isArchived: archived });
    const updated = await this.getConversation(id);
    if (!updated) throw new NotFoundException('대화를 찾을 수 없습니다.');
    return updated;
  }

  async updateConversationTheme(
    id: number,
    theme: Conversation['theme'],
    themeName: string,
  ): Promise<Conversation> {
    await this.conversationRepository.update(id, { theme, themeName });
    const updated = await this.getConversation(id);
    if (!updated) throw new NotFoundException('대화를 찾을 수 없습니다.');
    return updated;
  }

  async getConversationTheme(id: number): Promise<{
    theme: Conversation['theme'];
    themeName: string;
  }> {
    const conversation = await this.getConversation(id);
    if (!conversation) throw new NotFoundException('대화를 찾을 수 없습니다.');
    return {
      theme: conversation.theme,
      themeName: conversation.themeName,
    };
  }
}
