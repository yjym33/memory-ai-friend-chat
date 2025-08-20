import { Test, TestingModule } from '@nestjs/testing';
import { AgentService } from './agent.service';

describe('AgentService', () => {
  let service: AgentService;

  // Mock 설정들
  const mockLangGraphState = {
    messages: [],
    emotions: [],
    goals: [],
    userProfile: {},
    conversationContext: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentService],
    }).compile();

    service = module.get<AgentService>(AgentService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    it('사용자 메시지를 처리하고 응답을 생성해야 한다', async () => {
      const userId = 'test-user-id';
      const message = '안녕하세요!';

      const result = await service.processMessage(userId, message);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('빈 메시지에 대해 적절히 처리해야 한다', async () => {
      const userId = 'test-user-id';
      const message = '';

      const result = await service.processMessage(userId, message);

      expect(result).toBeDefined();
    });
  });
});
