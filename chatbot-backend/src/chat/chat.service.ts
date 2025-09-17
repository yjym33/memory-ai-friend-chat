import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entity/conversation.entity';
import { Repository } from 'typeorm';
import { User } from '../auth/entity/user.entity';
import { AiSettings, ChatMode } from '../ai-settings/entity/ai-settings.entity';
import { DocumentService } from '../document/document.service';
import { AiSettingsService } from '../ai-settings/ai-settings.service';
import { AgentService } from '../agent/agent.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * 채팅 관련 비즈니스 로직을 처리하는 서비스
 * 대화의 CRUD 작업을 담당합니다.
 */
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private documentService: DocumentService,
    private aiSettingsService: AiSettingsService,
    private agentService: AgentService,
    private configService: ConfigService,
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
    const updatedConversation = await this.getConversation(id);
    if (!updatedConversation) {
      throw new NotFoundException(`ID ${id}인 대화를 찾을 수 없습니다.`);
    }
    return updatedConversation;
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
  async getConversation(id: number): Promise<Conversation | null> {
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
  async updateConversation(
    id: number,
    messages: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<Conversation> {
    await this.conversationRepository.update(id, { messages });
    const updatedConversation = await this.getConversation(id);
    if (!updatedConversation) {
      throw new NotFoundException(`ID ${id}인 대화를 찾을 수 없습니다.`);
    }
    return updatedConversation;
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

  /**
   * 대화의 테마를 업데이트합니다.
   * @param id - 대화 ID
   * @param theme - 테마 설정
   * @param themeName - 테마 이름
   * @returns 업데이트된 대화 객체
   * @throws NotFoundException - 대화를 찾을 수 없는 경우
   */
  async updateConversationTheme(
    id: number,
    theme: Conversation['theme'],
    themeName: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOneBy({ id });
    if (!conversation) {
      throw new NotFoundException('대화를 찾을 수 없습니다.');
    }
    conversation.theme = theme;
    conversation.themeName = themeName;
    await this.conversationRepository.save(conversation);
    return conversation;
  }

  /**
   * 대화의 테마를 조회합니다.
   * @param id - 대화 ID
   * @returns 테마 설정
   * @throws NotFoundException - 대화를 찾을 수 없는 경우
   */
  async getConversationTheme(id: number): Promise<{
    theme: Conversation['theme'];
    themeName: string;
  }> {
    const conversation = await this.conversationRepository.findOneBy({ id });
    if (!conversation) {
      throw new NotFoundException('대화를 찾을 수 없습니다.');
    }
    return {
      theme: conversation.theme,
      themeName: conversation.themeName,
    };
  }

  /**
   * 모드에 따라 메시지를 처리합니다.
   */
  async processMessage(
    userId: string,
    conversationId: number,
    message: string,
  ): Promise<string> {
    const user = await this.getUserWithSettings(userId);
    const aiSettings = await this.aiSettingsService.findByUserId(userId);

    if (aiSettings.chatMode === ChatMode.PERSONAL) {
      return this.processPersonalMessage(user, conversationId, message);
    } else {
      return this.processBusinessMessage(
        user,
        conversationId,
        message,
        aiSettings,
      );
    }
  }

  /**
   * 개인 AI 친구 모드로 메시지를 처리합니다.
   */
  private async processPersonalMessage(
    user: User,
    conversationId: number,
    message: string,
  ): Promise<string> {
    // 기존 개인 AI 친구 로직 사용
    return this.agentService.processMessage(user.id, message);
  }

  /**
   * 기업 쿼리 시스템 모드로 메시지를 처리합니다.
   */
  private async processBusinessMessage(
    user: User,
    conversationId: number,
    message: string,
    aiSettings: AiSettings,
  ): Promise<string> {
    if (!user.organizationId) {
      return '기업 모드를 사용하려면 조직에 속해야 합니다.';
    }

    try {
      // 1. 관련 문서 검색
      const searchResults = await this.documentService.searchDocuments(
        user.organizationId,
        message,
        {
          documentTypes: aiSettings.businessSettings?.enabledDocumentTypes,
          limit: aiSettings.businessSettings?.maxSearchResults || 5,
          threshold: aiSettings.businessSettings?.confidenceThreshold || 0.7,
        },
      );

      // 2. 검색 결과가 없는 경우
      if (searchResults.length === 0) {
        return this.generateNoResultsResponse(message, aiSettings);
      }

      // 3. 검색 결과를 컨텍스트로 활용하여 LLM 응답 생성
      const context = this.buildContextFromSearchResults(searchResults);
      const prompt = this.buildBusinessPrompt(message, context, aiSettings);

      const response = await this.generateLLMResponse(prompt);

      // 4. 출처 정보 추가 (설정에 따라)
      if (aiSettings.businessSettings?.includeSourceCitations !== false) {
        return this.addSourceCitations(response, searchResults);
      }

      return response;
    } catch (error) {
      console.error('기업 모드 메시지 처리 실패:', error);
      return '죄송합니다. 문서 검색 중 오류가 발생했습니다. 다시 시도해주세요.';
    }
  }

  /**
   * 사용자 정보와 AI 설정을 함께 조회합니다.
   */
  private async getUserWithSettings(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  /**
   * 검색 결과에서 컨텍스트를 구성합니다.
   */
  private buildContextFromSearchResults(
    searchResults: Array<{ document: any; chunk: any; score: number }>,
  ): string {
    return searchResults
      .map((result, index) => {
        const { document, chunk, score } = result;
        return `[문서 ${index + 1}] ${document.title}\n${chunk.content}\n(관련도: ${(score * 100).toFixed(1)}%)`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * 기업 모드용 프롬프트를 구성합니다.
   */
  private buildBusinessPrompt(
    query: string,
    context: string,
    settings: AiSettings,
  ): string {
    const { businessSettings } = settings;

    let prompt = `당신은 회사의 문서를 기반으로 질문에 답하는 AI 어시스턴트입니다.

다음 문서 내용을 참고하여 질문에 정확하고 도움이 되는 답변을 제공해주세요:

===== 관련 문서 내용 =====
${context}
===========================

사용자 질문: ${query}

답변 지침:
- 제공된 문서 내용을 기반으로만 답변하세요
- 확실하지 않은 정보는 추측하지 마세요
- 구체적이고 실용적인 답변을 제공하세요`;

    // 응답 스타일 설정
    switch (businessSettings?.responseStyle) {
      case 'formal':
        prompt += '\n- 정중하고 공식적인 톤으로 답변하세요';
        break;
      case 'technical':
        prompt += '\n- 기술적이고 상세한 설명을 포함하세요';
        break;
      case 'casual':
        prompt += '\n- 친근하고 이해하기 쉬운 톤으로 답변하세요';
        break;
    }

    return prompt;
  }

  /**
   * LLM API를 호출하여 응답을 생성합니다.
   */
  private async generateLLMResponse(prompt: string): Promise<string> {
    try {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.3, // 기업 모드에서는 일관성 있는 답변을 위해 낮은 temperature
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('LLM API 호출 실패:', error);
      throw new Error('AI 응답 생성에 실패했습니다.');
    }
  }

  /**
   * 검색 결과가 없을 때의 응답을 생성합니다.
   */
  private generateNoResultsResponse(
    query: string,
    settings: AiSettings,
  ): string {
    const baseResponse = '죄송합니다. 질문과 관련된 문서를 찾을 수 없습니다.';

    switch (settings.businessSettings?.responseStyle) {
      case 'formal':
        return `${baseResponse} 다른 키워드로 검색하시거나, 관리자에게 문의해주시기 바랍니다.`;
      case 'casual':
        return `${baseResponse} 다른 방식으로 질문해보시거나, 키워드를 바꿔서 다시 시도해보세요!`;
      default:
        return `${baseResponse} 키워드를 바꾸거나 더 구체적으로 질문해주세요.`;
    }
  }

  /**
   * 응답에 출처 정보를 추가합니다.
   */
  private addSourceCitations(
    response: string,
    searchResults: Array<{ document: any; chunk: any; score: number }>,
  ): string {
    const citations = searchResults
      .map((result, index) => {
        const { document } = result;
        return `[${index + 1}] ${document.title} (${document.type})`;
      })
      .join('\n');

    return `${response}\n\n📚 **참고 문서:**\n${citations}`;
  }
}
