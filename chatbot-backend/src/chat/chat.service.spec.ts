import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatService } from './chat.service';
import { User } from '../auth/entity/user.entity';
import { DocumentService } from '../document/document.service';
import { AiSettingsService } from '../ai-settings/ai-settings.service';
import { AgentService } from '../agent/agent.service';
import { LLMAdapterService } from '../llm/services/llm-adapter.service';
import { ChatbotLlmService } from '../chatbot-llm/chatbot-llm.service';
import { ImageAdapterService } from '../image-generation/services/image-adapter.service';
import { ChatMode } from '../ai-settings/entity/ai-settings.entity';

describe('ChatService', () => {
  let service: ChatService;
  let userRepository: jest.Mocked<Repository<User>>;
  let agentService: jest.Mocked<AgentService>;
  let aiSettingsService: jest.Mocked<AiSettingsService>;

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockAiSettingsService = {
      findByUserId: jest.fn(),
    };

    const mockAgentService = {
      processMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
        {
          provide: DocumentService,
          useValue: {},
        },
        {
          provide: AiSettingsService,
          useValue: mockAiSettingsService,
        },
        {
          provide: AgentService,
          useValue: mockAgentService,
        },
        {
          provide: LLMAdapterService,
          useValue: {},
        },
        {
          provide: ChatbotLlmService,
          useValue: {},
        },
        {
          provide: ImageAdapterService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    userRepository = module.get(getRepositoryToken(User));
    agentService = module.get(AgentService);
    aiSettingsService = module.get(AiSettingsService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    it('should delegate to AgentService in PERSONAL mode', async () => {
      const userId = 'user-1';
      const conversationId = 1;
      const message = 'Hello';
      const mockUser = { id: userId, organizationId: null };
      const mockAiSettings = { chatMode: ChatMode.PERSONAL };

      userRepository.findOne.mockResolvedValue(mockUser as any);
      aiSettingsService.findByUserId.mockResolvedValue(mockAiSettings as any);
      agentService.processMessage.mockResolvedValue('Agent Response');

      const result = await service.processMessage(userId, conversationId, message);

      expect(agentService.processMessage).toHaveBeenCalledWith(userId, message);
      expect(result.response).toBe('Agent Response');
    });
  });
});
