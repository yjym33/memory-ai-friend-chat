import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatService } from './chat.service';
import { Conversation } from './entity/conversation.entity';

describe('ChatService', () => {
  let service: ChatService;
  let repository: jest.Mocked<Repository<Conversation>>;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    repository = module.get(getRepositoryToken(Conversation));
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('createConversation', () => {
    it('새로운 대화를 생성해야 한다', async () => {
      const userId = 'test-user-id';
      const mockConversation = {
        id: 1,
        title: '새 대화',
        messages: [],
        userId,
        pinned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.create.mockReturnValue(mockConversation as any);
      repository.save.mockResolvedValue(mockConversation as any);

      const result = await service.createConversation(userId);

      expect(repository.create).toHaveBeenCalledWith({
        messages: [],
        userId,
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockConversation);
    });
  });
});
