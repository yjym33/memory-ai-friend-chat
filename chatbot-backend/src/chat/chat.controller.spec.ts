import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationService } from './conversation.service';
import { ConfigService } from '@nestjs/config';
import { AiSettingsService } from '../ai-settings/ai-settings.service';
import { AgentService } from '../agent/agent.service';
import { FileExtractionService } from '../common/services/file-extraction.service';
import { LLMOrchestratorService } from '../llm/services/llm-orchestrator.service';
import { ImageOrchestratorService } from '../image-generation/services/image-orchestrator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DocumentSource } from './types/chat.types';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: jest.Mocked<ChatService>;
  let conversationService: jest.Mocked<ConversationService>;

  beforeEach(async () => {
    const mockChatService = {
      processMessage: jest.fn(),
      processMessageStream: jest.fn(),
      isImageGenerationRequest: jest.fn(),
    };

    const mockConversationService = {
      getConversation: jest.fn(),
      updateConversation: jest.fn(),
      addMessages: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: ConversationService, useValue: mockConversationService },
        { provide: ConfigService, useValue: {} },
        { provide: AiSettingsService, useValue: {} },
        { provide: AgentService, useValue: {} },
        { provide: FileExtractionService, useValue: {} },
        { provide: LLMOrchestratorService, useValue: {} },
        { provide: ImageOrchestratorService, useValue: {} },
        { provide: JwtService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChatController>(ChatController);
    chatService = module.get(ChatService);
    conversationService = module.get(ConversationService);
  });

  describe('chatCompletion', () => {
    it('should process message and add messages to conversation', async () => {
      const conversationId = 1;
      const userId = 'user-1';
      const message = 'Hello';
      const response = 'Hi there';
      const sources: DocumentSource[] = [];

      chatService.processMessage.mockResolvedValue({ response, sources });
      
      const req = { user: { userId } } as any;
      const body = { message };

      const result = await controller.chatCompletion(conversationId, body, req);

      expect(chatService.processMessage).toHaveBeenCalledWith(userId, conversationId, message);
      expect(conversationService.addMessages).toHaveBeenCalledWith(conversationId, [
        { role: 'user', content: message },
        { role: 'assistant', content: response, sources },
      ]);
      expect(result).toEqual({
        role: 'assistant',
        content: response,
        sources: [],
      });
    });

    it('should return error message on failure', async () => {
      chatService.processMessage.mockRejectedValue(new Error('Test error'));
      
      const req = { user: { userId: 'u1' } } as any;
      const result = await controller.chatCompletion(1, { message: 'hi' }, req);

      expect(result.content).toContain('오류');
    });
  });
});
