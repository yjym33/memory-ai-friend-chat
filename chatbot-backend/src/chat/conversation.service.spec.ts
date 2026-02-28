import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationService } from './conversation.service';
import { Conversation } from './entity/conversation.entity';
import { NotFoundException } from '@nestjs/common';

describe('ConversationService', () => {
  let service: ConversationService;
  let repository: jest.Mocked<Repository<Conversation>>;

  const mockConversation: Conversation = {
    id: 1,
    title: 'Test Conversation',
    messages: [],
    userId: 'test-user-id',
    pinned: false,
    isArchived: false,
    theme: {} as any,
    themeName: 'Default',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {} as any,
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
    repository = module.get(getRepositoryToken(Conversation));
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const userId = 'test-user-id';
      repository.create.mockReturnValue(mockConversation);
      repository.save.mockResolvedValue(mockConversation);

      const result = await service.createConversation(userId);

      expect(repository.create).toHaveBeenCalledWith({
        messages: [],
        userId,
      });
      expect(repository.save).toHaveBeenCalledWith(mockConversation);
      expect(result).toEqual(mockConversation);
    });
  });

  describe('getConversation', () => {
    it('should return a conversation by id', async () => {
      repository.findOne.mockResolvedValue(mockConversation);

      const result = await service.getConversation(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockConversation);
    });

    it('should return null if conversation not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getConversation(999);

      expect(result).toBeNull();
    });
  });

  describe('getAllConversations', () => {
    it('should return all conversations for a user', async () => {
      const userId = 'test-user-id';
      repository.find.mockResolvedValue([mockConversation]);

      const result = await service.getAllConversations(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockConversation]);
    });
  });

  describe('updateConversationTitle', () => {
    it('should update conversation title', async () => {
      const newTitle = 'Updated Title';
      const updatedConversation = { ...mockConversation, title: newTitle };
      
      repository.update.mockResolvedValue({ affected: 1 } as any);
      repository.findOne.mockResolvedValue(updatedConversation);

      const result = await service.updateConversationTitle(1, newTitle);

      expect(repository.update).toHaveBeenCalledWith(1, { title: newTitle });
      expect(result.title).toBe(newTitle);
    });

    it('should throw NotFoundException if conversation to update not found', async () => {
      repository.update.mockResolvedValue({ affected: 0 } as any);
      repository.findOne.mockResolvedValue(null);

      await expect(service.updateConversationTitle(999, 'title')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.deleteConversation(1);

      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if conversation to delete not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.deleteConversation(999)).rejects.toThrow(NotFoundException);
    });
  });
});
