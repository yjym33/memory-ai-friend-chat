import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AiSettingsService } from './ai-settings.service';
import { AiSettings } from './entity/ai-settings.entity';
import {
  CreateAiSettingsDto,
  UpdateAiSettingsDto,
} from './dto/ai-settings.dto';

describe('AiSettingsService', () => {
  let service: AiSettingsService;
  let repository: jest.Mocked<Repository<AiSettings>>;

  const mockAiSettings: AiSettings = {
    id: 1,
    userId: 'test-user-id',
    user: null,
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
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiSettingsService,
        {
          provide: getRepositoryToken(AiSettings),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AiSettingsService>(AiSettingsService);
    repository = module.get(getRepositoryToken(AiSettings));
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('새로운 AI 설정을 생성해야 한다', async () => {
      const createDto: CreateAiSettingsDto = {
        userId: 'test-user-id',
        personalityType: '친근함',
        speechStyle: '반말',
        emojiUsage: 3,
        nickname: 'AI친구',
        empathyLevel: 3,
      };

      repository.create.mockReturnValue(mockAiSettings);
      repository.save.mockResolvedValue(mockAiSettings);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockAiSettings);
      expect(result).toEqual(mockAiSettings);
    });
  });

  describe('findByUserId', () => {
    it('사용자 ID로 AI 설정을 찾아야 한다', async () => {
      repository.findOne.mockResolvedValue(mockAiSettings);

      const result = await service.findByUserId('test-user-id');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
      });
      expect(result).toEqual(mockAiSettings);
    });

    it('설정이 없으면 null을 반환해야 한다', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUserId('non-existent-user');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('AI 설정을 업데이트해야 한다', async () => {
      const updateDto: UpdateAiSettingsDto = {
        personalityType: '차분함',
        emojiUsage: 5,
      };

      repository.findOne.mockResolvedValue(mockAiSettings);
      repository.save.mockResolvedValue({
        ...mockAiSettings,
        ...updateDto,
      });

      const result = await service.update('test-user-id', updateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.personalityType).toBe('차분함');
      expect(result.emojiUsage).toBe(5);
    });

    it('존재하지 않는 설정 업데이트 시 NotFoundException을 던져야 한다', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-user', { personalityType: '차분함' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('AI 설정을 삭제해야 한다', async () => {
      repository.findOne.mockResolvedValue(mockAiSettings);
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove('test-user-id');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
      });
      expect(repository.delete).toHaveBeenCalledWith({
        userId: 'test-user-id',
      });
    });

    it('존재하지 않는 설정 삭제 시 NotFoundException을 던져야 한다', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
