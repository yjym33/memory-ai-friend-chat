import { Test, TestingModule } from '@nestjs/testing';
import { AiSettingsController } from './ai-settings.controller';
import { AiSettingsService } from './ai-settings.service';
import {
  CreateAiSettingsDto,
  UpdateAiSettingsDto,
} from './dto/ai-settings.dto';

describe('AiSettingsController', () => {
  let controller: AiSettingsController;
  let service: jest.Mocked<AiSettingsService>;

  const mockAiSettings = {
    id: 1,
    userId: 'test-user-id',
    personalityType: '친근함',
    speechStyle: '반말',
    emojiUsage: 3,
    nickname: 'AI친구',
    empathyLevel: 3,
    memoryRetentionDays: 90,
    memoryPriorities: {
      personal: 5,
      hobby: 3,
      work: 4,
      emotion: 5,
    },
    userProfile: {
      interests: ['독서', '영화'],
      currentGoals: ['건강 관리'],
      importantDates: [{ name: '생일', date: '2023-01-01' }],
    },
    avoidTopics: ['정치', '종교'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiSettingsController],
      providers: [
        {
          provide: AiSettingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AiSettingsController>(AiSettingsController);
    service = module.get(AiSettingsService);
  });

  it('컨트롤러가 정의되어야 한다', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('AI 설정을 생성해야 한다', async () => {
      const createDto: CreateAiSettingsDto = {
        userId: 'test-user-id',
        personalityType: '친근함',
        speechStyle: '반말',
        emojiUsage: 3,
        nickname: 'AI친구',
        empathyLevel: 3,
      };

      service.create.mockResolvedValue(mockAiSettings);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockAiSettings);
    });
  });

  describe('findByUserId', () => {
    it('사용자 ID로 AI 설정을 조회해야 한다', async () => {
      service.findByUserId.mockResolvedValue(mockAiSettings);

      const result = await controller.findByUserId('test-user-id');

      expect(service.findByUserId).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(mockAiSettings);
    });
  });

  describe('update', () => {
    it('AI 설정을 업데이트해야 한다', async () => {
      const updateDto: UpdateAiSettingsDto = {
        personalityType: '차분함',
        emojiUsage: 5,
      };

      const updatedSettings = {
        ...mockAiSettings,
        ...updateDto,
      };

      service.update.mockResolvedValue(updatedSettings);

      const result = await controller.update('test-user-id', updateDto);

      expect(service.update).toHaveBeenCalledWith('test-user-id', updateDto);
      expect(result).toEqual(updatedSettings);
    });
  });

  describe('remove', () => {
    it('AI 설정을 삭제해야 한다', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('test-user-id');

      expect(service.remove).toHaveBeenCalledWith('test-user-id');
    });
  });
});
