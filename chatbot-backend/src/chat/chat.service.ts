import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entity/conversation.entity';
import { Repository } from 'typeorm';
import { User } from '../auth/entity/user.entity';
import { AiSettings, ChatMode } from '../ai-settings/entity/ai-settings.entity';
import { DocumentService } from '../document/document.service';
import { AiSettingsService } from '../ai-settings/ai-settings.service';
import { AgentService } from '../agent/agent.service';
import { LLMAdapterService } from '../llm/services/llm-adapter.service';
import { ChatbotLlmService } from '../chatbot-llm/chatbot-llm.service';
import { ImageAdapterService } from '../image-generation/services/image-adapter.service';
import { LLMStreamChunk } from '../llm/types/llm.types';
import { LLM_CONFIG, ERROR_MESSAGES } from '../common/constants/llm.constants';

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
    private llmAdapterService: LLMAdapterService,
    private chatbotLlmService: ChatbotLlmService,
    private imageAdapterService: ImageAdapterService,
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
   * 대화의 보관 상태를 업데이트합니다.
   * @param id - 대화 ID
   * @param archived - 보관 상태
   * @returns 업데이트된 대화 객체
   * @throws NotFoundException - 대화를 찾을 수 없는 경우
   */
  async updateConversationArchive(
    id: number,
    archived: boolean,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOneBy({ id });
    if (!conversation) {
      throw new NotFoundException('대화를 찾을 수 없습니다.');
    }
    conversation.isArchived = archived;
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
  ): Promise<{
    response: string;
    sources: Array<{
      title: string;
      documentId: string;
      type?: string;
      relevance: number;
      snippet: string;
    }>;
  }> {
    const user = await this.getUserWithSettings(userId);
    const aiSettings = await this.aiSettingsService.findByUserId(userId);

    if (aiSettings.chatMode === ChatMode.PERSONAL) {
      const response = await this.processPersonalMessage(
        user,
        conversationId,
        message,
      );
      return { response, sources: [] };
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
  ): Promise<{
    response: string;
    sources: Array<{
      title: string;
      documentId: string;
      type?: string;
      relevance: number;
      snippet: string;
    }>;
  }> {
    if (!user.organizationId) {
      return {
        response: '기업 모드를 사용하려면 조직에 속해야 합니다.',
        sources: [],
      };
    }

    try {
      console.log(
        `🔍 기업모드 문서 검색 시작: ${user.organizationId} - "${message}"`,
      );

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

      console.log(`📊 검색 결과: ${searchResults.length}개 문서 청크 발견`);

      // 2. 검색 결과가 없는 경우
      if (searchResults.length === 0) {
        console.log('❌ 관련 문서를 찾을 수 없음');
        return {
          response: this.generateNoResultsResponse(message, aiSettings),
          sources: [],
        };
      }

      // 3. 검색 결과를 컨텍스트로 활용하여 LLM 응답 생성
      const context = this.buildContextFromSearchResults(searchResults);
      const prompt = this.buildBusinessPrompt(message, context, aiSettings);

      console.log('🤖 AI 응답 생성 중...');
      const response = await this.generateLLMResponse(user.id, prompt);

      // 4. 출처 정보 생성
      const extractedSources = searchResults.slice(0, 5).map((r) => ({
        title: r.document?.title,
        documentId: r.document?.id,
        type: r.document?.type,
        relevance: Number(r.score.toFixed(3)),
        snippet:
          (r.chunk?.content || '').substring(0, 220).replace(/\s+/g, ' ') +
          ((r.chunk?.content || '').length > 220 ? '...' : ''),
      }));

      // 5. 출처 정보 추가 (설정에 따라)
      if (aiSettings.businessSettings?.includeSourceCitations !== false) {
        const finalResponse = this.addSourceCitations(response, searchResults);
        console.log('✅ 기업모드 응답 생성 완료 (출처 포함)');
        return { response: finalResponse, sources: extractedSources };
      }

      console.log('✅ 기업모드 응답 생성 완료');
      return { response, sources: extractedSources };
    } catch (error) {
      console.error('❌ 기업 모드 메시지 처리 실패:', error);
      return {
        response: `죄송합니다. 문서 검색 중 오류가 발생했습니다. 

📝 **문제 해결 방법:**
1. 다른 키워드로 다시 검색해보세요
2. 문서가 업로드되어 있는지 확인해주세요
3. 관리자에게 문의해주세요

🔧 오류 정보: ${error.message}`,
        sources: [],
      };
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

    let prompt = `당신은 기업의 내부 문서를 기반으로 정확하고 유용한 정보를 제공하는 전문 AI 어시스턴트입니다.

📋 **참고할 문서 내용:**
${context}

❓ **사용자 질문:** ${query}

📝 **답변 작성 지침:**
1. **정확성 우선**: 제공된 문서 내용만을 기반으로 답변하세요
2. **명확한 구조**: 답변을 논리적으로 구성하세요
3. **실용적 정보**: 사용자가 바로 활용할 수 있는 정보를 제공하세요
4. **불확실성 인정**: 문서에 없는 내용은 추측하지 말고 명시하세요
5. **추가 도움**: 필요시 추가 질문이나 확인이 필요한 부분을 안내하세요`;

    // 응답 스타일 설정
    switch (businessSettings?.responseStyle) {
      case 'formal':
        prompt += '\n\n🎯 **톤**: 정중하고 전문적인 공식 톤으로 답변하세요';
        break;
      case 'technical':
        prompt +=
          '\n\n🔧 **톤**: 기술적이고 상세한 설명을 포함한 전문가 톤으로 답변하세요';
        break;
      case 'casual':
        prompt +=
          '\n\n😊 **톤**: 친근하고 이해하기 쉬운 대화체 톤으로 답변하세요';
        break;
      default:
        prompt +=
          '\n\n💼 **톤**: 전문적이면서도 접근하기 쉬운 톤으로 답변하세요';
    }

    prompt +=
      '\n\n✨ **추가 요구사항:**\n- 답변은 한국어로 작성하세요\n- 중요한 내용은 강조 표시를 사용하세요\n- 단계별 설명이 필요한 경우 번호를 매겨 정리하세요';

    return prompt;
  }

  /**
   * LLM API를 호출하여 응답을 생성합니다.
   * @param userId - 사용자 ID
   * @param prompt - 시스템 프롬프트
   * @returns AI 응답 텍스트
   */
  private async generateLLMResponse(
    userId: string,
    prompt: string,
  ): Promise<string> {
    try {
      const response = await this.llmAdapterService.generateResponse(
        userId,
        [
          {
            role: 'system',
            content: prompt,
          },
        ],
        {
          temperature: 0.3, // 기업 모드에서는 일관성 있는 답변을 위해 낮은 temperature
          maxTokens: 1000,
        },
      );

      return response.content;
    } catch (error) {
      console.error('LLM API 호출 실패:', error);
      throw new Error('AI 응답 생성에 실패했습니다.');
    }
  }

  /**
   * LLM API를 호출하여 스트리밍 방식으로 응답을 생성합니다.
   * @param userId - 사용자 ID
   * @param messages - 대화 메시지 배열
   * @param onChunk - 각 청크를 받을 때 호출되는 콜백
   */
  private async generateLLMResponseStream(
    userId: string,
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    try {
      // LLMAdapterService를 사용하여 스트리밍 응답 생성
      await this.llmAdapterService.generateStreamingResponse(
        userId,
        messages,
        (chunk: LLMStreamChunk) => {
          // chunk.content가 있으면 전송 (빈 문자열도 전송 가능)
          if (chunk.content !== undefined) {
            onChunk(chunk.content);
          }
          // done이 true이면 완료 신호로 처리 (빈 문자열 전송)
          if (chunk.done && chunk.content === '') {
            // 완료 신호는 이미 onChunk('')로 전달됨
          }
        },
      );
    } catch (error) {
      console.error('LLM 스트리밍 응답 생성 실패:', error.message);
      throw error;
    }
  }

  /**
   * 메시지를 스트리밍 방식으로 처리합니다.
   * 이미지 생성 요청인 경우 이미지를 생성하고, 그렇지 않으면 텍스트 응답을 생성합니다.
   */
  async processMessageStream(
    userId: string,
    conversationId: number,
    message: string,
    onChunk: (chunk: string) => void,
    onSources?: (sources: any[]) => void,
  ): Promise<{ images?: string[]; imageMetadata?: any }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 🎨 이미지 생성 요청 감지
    if (this.isImageGenerationRequest(message)) {
      console.log('🎨 이미지 생성 요청 감지됨:', message);
      try {
        const result = await this.processImageGenerationRequest(
          userId,
          conversationId,
          message,
        );

        // 이미지 생성 응답을 스트리밍으로 전송
        onChunk(result.response);

        // 이미지 정보 반환 (컨트롤러에서 처리)
        return {
          images: result.images,
          imageMetadata: result.imageMetadata,
        };
      } catch (error) {
        console.error('❌ 이미지 생성 실패:', error);
        onChunk(`이미지 생성 중 오류가 발생했습니다: ${error.message}`);
        return {};
      }
    }

    // AI 설정 조회
    const aiSettings = await this.aiSettingsService.findByUserId(userId);
    const mode = aiSettings?.chatMode || ChatMode.PERSONAL;

    if (mode === ChatMode.BUSINESS) {
      // 기업 모드: 문서 검색 기반 응답
      await this.processBusinessMessageStream(
        user,
        conversationId,
        message,
        aiSettings,
        onChunk,
        onSources,
      );
    } else {
      // 개인 모드: AI 친구 기반 응답
      await this.processPersonalMessageStream(
        user,
        conversationId,
        message,
        aiSettings,
        onChunk,
      );
    }

    return {};
  }

  /**
   * 개인 모드 메시지를 스트리밍 방식으로 처리합니다.
   *
   * 새로운 아키텍처에 따라 다음과 같이 처리합니다:
   * 1. chatbot-llm 서비스에서 개인화된 프롬프트 생성 (AI 설정 + 메모리 통합)
   * 2. LLMAdapterService로 LLM 호출 (다중 Provider 지원)
   * 3. chatbot-llm 서비스에 메모리 저장 (비동기, 실패해도 계속 진행)
   *
   * @param user - 사용자 엔티티
   * @param conversationId - 대화 ID
   * @param message - 사용자 메시지
   * @param aiSettings - AI 설정
   * @param onChunk - 스트리밍 청크 콜백 함수
   */
  private async processPersonalMessageStream(
    user: User,
    conversationId: number,
    message: string,
    aiSettings: AiSettings,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    try {
      // 1. chatbot-llm 서비스에서 개인화된 프롬프트 생성
      // AI 설정, 메모리, 대화 컨텍스트를 통합하여 최적화된 프롬프트 생성
      const { messages } = await this.chatbotLlmService.generatePrompt(
        user.id,
        conversationId.toString(),
        message,
        aiSettings,
        LLM_CONFIG.MAX_CONTEXT_MESSAGES, // 최대 컨텍스트 메시지 수
      );

      console.log(
        '📤 LLM에 전송하는 메시지:',
        JSON.stringify(messages, null, 2),
      );

      // 2. LLMAdapterService로 LLM 호출 (스트리밍)
      // 다중 Provider 지원 (OpenAI, Google, Anthropic)
      let fullResponse = '';
      await this.generateLLMResponseStream(user.id, messages, (chunk) => {
        // 각 청크를 누적하여 전체 응답 저장
        fullResponse += chunk;
        // 클라이언트에 청크 전송
        onChunk(chunk);
      });

      // 3. chatbot-llm 서비스에 메모리 저장 (비동기, 실패해도 계속 진행)
      // 메모리 저장 실패는 치명적이지 않으므로 에러를 던지지 않음
      // catch에서 에러를 무시하고 계속 진행
      this.chatbotLlmService
        .saveMemory(
          user.id,
          conversationId.toString(),
          message,
          fullResponse,
          3, // 기본 중요도 (일반 대화)
          'conversation', // 메모리 타입
        )
        .catch((error) => {
          // 메모리 저장 실패는 로깅만 하고 무시
          console.error('메모리 저장 실패 (무시됨):', error);
        });

      // 4. 목표 추출 및 저장 (비동기, 백그라운드에서 실행)
      // AgentService를 사용하여 목표 추출 및 저장 수행
      // 이 과정에서 메시지에서 목표 키워드를 추출하고 데이터베이스에 저장합니다
      this.agentService.processMessage(user.id, message).catch((error) => {
        // 목표 추출 실패는 치명적이지 않으므로 에러를 무시
        // 대화는 정상적으로 진행되며, 목표만 기록되지 않음
        console.error('목표 추출 실패 (무시됨):', error);
      });
    } catch (error) {
      console.error('개인 모드 스트리밍 처리 오류:', error.message);

      // 에러 메시지를 사용자에게 전달
      const errorMessage = error.message || ERROR_MESSAGES.GENERAL_ERROR;
      onChunk(errorMessage + ' ' + ERROR_MESSAGES.RETRY_MESSAGE);

      throw error;
    }
  }

  /**
   * 개인 모드 시스템 프롬프트 생성
   */
  private buildPersonalSystemPrompt(aiSettings: AiSettings): string {
    const personality = aiSettings.personalityType || '친근함';
    const speechStyle = aiSettings.speechStyle || '반말';
    const emojiLevel = aiSettings.emojiUsage || 3;
    const nickname = aiSettings.nickname || '친구';

    let prompt = `You are a friendly AI companion. Follow these guidelines strictly:

1. Personality: Be warm and friendly
2. Language: Respond in Korean using casual speech (반말)
3. Emoji: Use ${emojiLevel >= 4 ? 'many' : emojiLevel >= 2 ? 'some' : 'few'} emojis naturally
4. Call the user: "${nickname}"

IMPORTANT RULES:
- Give ONE clear, concise answer
- Do NOT repeat the same words or phrases
- Do NOT use special characters like ◆ or �
- Keep responses natural and conversational
- Vary your language and expressions
- Answer directly without unnecessary elaboration`;

    return prompt;
  }

  /**
   * 기업 모드 메시지를 스트리밍 방식으로 처리합니다.
   */
  private async processBusinessMessageStream(
    user: User,
    conversationId: number,
    message: string,
    aiSettings: AiSettings,
    onChunk: (chunk: string) => void,
    onSources?: (sources: any[]) => void,
  ): Promise<void> {
    if (!user.organizationId) {
      onChunk('기업 모드를 사용하려면 조직에 속해야 합니다.');
      return;
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
        const noResultResponse = this.generateNoResultsResponse(
          message,
          aiSettings,
        );
        for (let i = 0; i < noResultResponse.length; i += 5) {
          onChunk(noResultResponse.slice(i, i + 5));
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        return;
      }

      // 3. 검색 결과를 컨텍스트로 활용하여 LLM 스트리밍 응답 생성
      const context = this.buildContextFromSearchResults(searchResults);
      const systemPrompt = this.buildBusinessPrompt(
        message,
        context,
        aiSettings,
      );

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ];

      await this.generateLLMResponseStream(user.id, messages, onChunk);

      // 4. 출처 정보 전송
      if (onSources) {
        const sources = searchResults.slice(0, 5).map((result) => ({
          title: result.document.title,
          documentId: result.document.id,
          type: result.document.type,
          relevance: result.score,
          snippet: result.chunk.content.substring(0, 200),
        }));
        onSources(sources);
      }
    } catch (error) {
      console.error('기업 모드 스트리밍 처리 오류:', error);
      onChunk('죄송합니다. 처리 중 오류가 발생했습니다.');
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

  // ============================================
  // 이미지 생성 관련 메서드
  // ============================================

  /**
   * 이미지 생성 요청인지 감지합니다.
   * @param message - 사용자 메시지
   * @returns 이미지 생성 요청 여부
   */
  isImageGenerationRequest(message: string): boolean {
    const imageKeywords = [
      // 한국어 키워드
      '그림 그려',
      '그림그려',
      '이미지 생성',
      '이미지생성',
      '이미지 만들어',
      '이미지만들어',
      '그림 만들어',
      '그림만들어',
      '그려줘',
      '그려 줘',
      '이미지 그려',
      '이미지그려',
      '그림을 그려',
      '이미지를 생성',
      '이미지를 만들어',
      '사진 만들어',
      '사진만들어',
      '사진 생성',
      '사진생성',
      // 명령어
      '/image',
      '/이미지',
      '/그림',
      '/사진',
      // 영어 키워드
      'draw',
      'generate image',
      'create image',
      'make image',
      'draw me',
      'generate a',
      'create a picture',
      'make a picture',
    ];

    const lowerMessage = message.toLowerCase();
    return imageKeywords.some((keyword) =>
      lowerMessage.includes(keyword.toLowerCase()),
    );
  }

  /**
   * 이미지 생성 프롬프트를 추출합니다.
   * @param message - 사용자 메시지
   * @returns 추출된 프롬프트
   */
  extractImagePrompt(message: string): string {
    // 명령어 제거
    let cleanedMessage = message
      .replace(/^\/image\s*/i, '')
      .replace(/^\/이미지\s*/, '')
      .replace(/^\/그림\s*/, '')
      .replace(/^\/사진\s*/, '');

    // 한국어 요청 패턴 제거
    const patternsToRemove = [
      /그림\s*(그려|만들어)\s*(줘|주세요|줄래|줄래요)?/g,
      /이미지\s*(생성|만들어|그려)\s*(줘|주세요|줄래|줄래요)?/g,
      /사진\s*(생성|만들어)\s*(줘|주세요|줄래|줄래요)?/g,
      /(을|를)\s*그려\s*(줘|주세요)?/g,
      /(을|를)\s*만들어\s*(줘|주세요)?/g,
    ];

    for (const pattern of patternsToRemove) {
      cleanedMessage = cleanedMessage.replace(pattern, '');
    }

    // 영어 요청 패턴 제거
    cleanedMessage = cleanedMessage
      .replace(/draw\s*(me\s*)?(a\s*)?/gi, '')
      .replace(/generate\s*(a\s*)?(image\s*of\s*)?/gi, '')
      .replace(/create\s*(a\s*)?(picture\s*of\s*)?/gi, '')
      .replace(/make\s*(me\s*)?(a\s*)?(image\s*of\s*)?/gi, '');

    return cleanedMessage.trim() || message;
  }

  /**
   * 이미지 생성 요청을 처리합니다.
   * @param userId - 사용자 ID
   * @param conversationId - 대화 ID
   * @param message - 사용자 메시지
   * @returns 이미지 생성 결과
   */
  async processImageGenerationRequest(
    userId: string,
    conversationId: number,
    message: string,
  ): Promise<{
    response: string;
    images: string[];
    messageType: 'image';
    imageMetadata?: {
      model: string;
      provider: string;
      prompt: string;
    };
  }> {
    const prompt = this.extractImagePrompt(message);

    console.log(`🎨 이미지 생성 요청 감지 - 프롬프트: ${prompt}`);

    try {
      const result = await this.imageAdapterService.generateImage(
        userId,
        prompt,
        {
          n: 1,
        },
      );

      const images = result.images.map((img) => img.url);

      return {
        response: `🎨 "${prompt}"에 대한 이미지를 생성했습니다.`,
        images,
        messageType: 'image',
        imageMetadata: {
          model: result.model,
          provider: result.provider,
          prompt,
        },
      };
    } catch (error) {
      console.error('❌ 이미지 생성 실패:', error);
      throw new Error(`이미지 생성 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 메시지 처리 (이미지 생성 통합)
   * 이미지 생성 요청이면 이미지를 생성하고, 아니면 기존 텍스트 처리를 수행합니다.
   */
  async processMessageWithImageSupport(
    userId: string,
    conversationId: number,
    message: string,
  ): Promise<{
    response: string;
    images?: string[];
    messageType: 'text' | 'image';
    sources?: Array<{
      title: string;
      documentId: string;
      type?: string;
      relevance: number;
      snippet: string;
    }>;
    imageMetadata?: {
      model: string;
      provider: string;
      prompt: string;
    };
  }> {
    // 이미지 생성 요청 감지
    if (this.isImageGenerationRequest(message)) {
      try {
        const imageResult = await this.processImageGenerationRequest(
          userId,
          conversationId,
          message,
        );
        return imageResult;
      } catch (error) {
        // 이미지 생성 실패 시 오류 메시지 반환
        return {
          response: error.message || '이미지 생성 중 오류가 발생했습니다.',
          messageType: 'text',
        };
      }
    }

    // 기존 텍스트 처리 로직
    const { response, sources } = await this.processMessage(
      userId,
      conversationId,
      message,
    );

    return {
      response,
      messageType: 'text',
      sources,
    };
  }
}
