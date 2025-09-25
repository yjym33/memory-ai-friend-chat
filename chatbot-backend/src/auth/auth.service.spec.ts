import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from './entity/user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'test-uuid',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    gender: 'male',
    birthYear: 1990,
    userType: 'individual' as any,
    role: 'user' as any,
    businessProfile: {},
    conversations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('새 사용자를 성공적으로 등록해야 한다', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const result = await service.register(
        'test@example.com',
        'password123',
        'Test User',
        'male',
        1990,
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepository.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith({ userId: mockUser.id });
      expect(result).toEqual({
        userId: mockUser.id,
        token: 'jwt-token',
      });
    });

    it('이미 존재하는 이메일로 등록 시 ConflictException을 던져야 한다', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register(
          'test@example.com',
          'password123',
          'Test User',
          'male',
          1990,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('올바른 자격증명으로 로그인해야 한다', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login('test@example.com', 'password123');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({ userId: mockUser.id });
      expect(result).toEqual({
        userId: mockUser.id,
        token: 'jwt-token',
      });
    });

    it('존재하지 않는 사용자로 로그인 시 UnauthorizedException을 던져야 한다', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('잘못된 비밀번호로 로그인 시 UnauthorizedException을 던져야 한다', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateToken', () => {
    it('유효한 토큰을 검증해야 한다', async () => {
      jwtService.verify.mockReturnValue({ userId: mockUser.id });
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateToken('valid-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual({ userId: mockUser.id });
    });

    it('유효하지 않은 토큰에 대해 UnauthorizedException을 던져야 한다', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('유효한 토큰이지만 사용자가 존재하지 않을 때 UnauthorizedException을 던져야 한다', async () => {
      jwtService.verify.mockReturnValue({ userId: 'non-existent-user' });
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.validateToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
