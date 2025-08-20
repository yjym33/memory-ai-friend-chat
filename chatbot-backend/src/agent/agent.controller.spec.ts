import { Test, TestingModule } from '@nestjs/testing';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

describe('AgentController', () => {
  let controller: AgentController;
  let service: jest.Mocked<AgentService>;

  beforeEach(async () => {
    const mockService = {
      processMessage: jest.fn(),
      analyzeEmotion: jest.fn(),
      updateGoalProgress: jest.fn(),
      generateResponse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        {
          provide: AgentService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AgentController>(AgentController);
    service = module.get(AgentService);
  });

  it('컨트롤러가 정의되어야 한다', () => {
    expect(controller).toBeDefined();
  });

  describe('processMessage', () => {
    it('메시지 처리 요청을 서비스로 전달해야 한다', async () => {
      const userId = 'test-user-id';
      const message = '안녕하세요!';
      const context = {
        emotions: [],
        goals: [],
        userProfile: {
          interests: ['독서'],
          currentGoals: [],
          importantDates: [],
        },
      };

      const expectedResponse = {
        response: '안녕하세요! 반가워요!',
        emotions: [],
        updatedGoals: [],
      };

      service.processMessage.mockResolvedValue(expectedResponse);

      const result = await controller.processMessage({
        userId,
        message,
        context,
      });

      expect(service.processMessage).toHaveBeenCalledWith(
        userId,
        message,
        context,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('analyzeEmotion', () => {
    it('감정 분석 요청을 서비스로 전달해야 한다', async () => {
      const message = '오늘 정말 기뻐요!';
      const expectedEmotion = {
        type: 'happy',
        intensity: 8,
        confidence: 0.9,
      };

      service.analyzeEmotion.mockResolvedValue(expectedEmotion);

      const result = await controller.analyzeEmotion({ message });

      expect(service.analyzeEmotion).toHaveBeenCalledWith(message);
      expect(result).toEqual(expectedEmotion);
    });
  });
});
