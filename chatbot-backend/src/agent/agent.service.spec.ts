import { Test, TestingModule } from '@nestjs/testing';
import { AgentService } from './agent.service';
import { EmotionAnalyzerService } from './services/emotion-analyzer.service';
import { GoalManagerService } from './services/goal-manager.service';
import { MemoryService } from './services/memory.service';
import { PromptGeneratorService } from './services/prompt-generator.service';
import { AgentCacheService } from './services/agent-cache.service';
import { SuggestionService } from './services/suggestion.service';
import { AiSettingsService } from '../ai-settings/ai-settings.service';
import { LLMAdapterService } from '../llm/services/llm-adapter.service';

describe('AgentService', () => {
  let service: AgentService;
  let emotionAnalyzer: jest.Mocked<EmotionAnalyzerService>;
  let goalManager: jest.Mocked<GoalManagerService>;
  let memoryService: jest.Mocked<MemoryService>;
  let promptGenerator: jest.Mocked<PromptGeneratorService>;
  let aiSettingsService: jest.Mocked<AiSettingsService>;
  let llmAdapterService: jest.Mocked<LLMAdapterService>;

  beforeEach(async () => {
    const mockEmotionAnalyzer = {
      getRecentEmotions: jest.fn().mockResolvedValue([]),
      formatRecentEmotions: jest.fn().mockReturnValue([]),
      analyzeEmotion: jest.fn().mockReturnValue({ emotions: [] }),
      needsEmotionSupport: jest.fn().mockReturnValue(false),
      saveEmotions: jest.fn().mockResolvedValue(undefined),
    };

    const mockGoalManager = {
      getActiveGoals: jest.fn().mockResolvedValue([]),
      extractGoals: jest.fn().mockReturnValue({ goals: [] }),
      detectProgressFromMessage: jest.fn().mockResolvedValue(undefined),
    };

    const mockMemoryService = {
      getRecentMemories: jest.fn().mockResolvedValue([]),
      prioritizeMemories: jest.fn().mockReturnValue([]),
    };

    const mockPromptGenerator = {
      generatePromptWithMemory: jest.fn().mockReturnValue('System Prompt'),
    };

    const mockAiSettingsService = {
      findByUserId: jest.fn().mockResolvedValue({
        memoryRetentionDays: 7,
        memoryPriorities: {},
        llmConfig: { temperature: 0.8, maxTokens: 1024 },
      }),
    };

    const mockLLMAdapterService = {
      generateResponse: jest.fn().mockResolvedValue({ content: 'AI Response' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: EmotionAnalyzerService, useValue: mockEmotionAnalyzer },
        { provide: GoalManagerService, useValue: mockGoalManager },
        { provide: MemoryService, useValue: mockMemoryService },
        { provide: PromptGeneratorService, useValue: mockPromptGenerator },
        { provide: AgentCacheService, useValue: { getStats: jest.fn() } },
        { provide: SuggestionService, useValue: {} },
        { provide: AiSettingsService, useValue: mockAiSettingsService },
        { provide: LLMAdapterService, useValue: mockLLMAdapterService },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    emotionAnalyzer = module.get(EmotionAnalyzerService);
    goalManager = module.get(GoalManagerService);
    memoryService = module.get(MemoryService);
    promptGenerator = module.get(PromptGeneratorService);
    aiSettingsService = module.get(AiSettingsService);
    llmAdapterService = module.get(LLMAdapterService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    it('should coordinate services to produce a response', async () => {
      const userId = 'user-1';
      const message = 'Hello';

      const result = await service.processMessage(userId, message);

      expect(emotionAnalyzer.analyzeEmotion).toHaveBeenCalledWith(message);
      expect(goalManager.extractGoals).toHaveBeenCalledWith(message);
      expect(llmAdapterService.generateResponse).toHaveBeenCalled();
      expect(result).toBe('AI Response');
    });
  });
});
