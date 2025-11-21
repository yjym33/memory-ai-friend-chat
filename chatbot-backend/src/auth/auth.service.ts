import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { EncryptionService } from '../common/services/encryption.service';
import { LLMProvider } from '../llm/types/llm.types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private encryptionService: EncryptionService,
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
    gender: string,
    birthYear: number,
    passwordCheck?: string,
  ) {
    if (passwordCheck !== undefined && password !== passwordCheck) {
      throw new ConflictException(
        '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
      );
    }
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('이미 등록된 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.save({
      email,
      password: hashedPassword,
      name,
      gender,
      birthYear,
    });

    const token = this.jwtService.sign({ userId: user.id });

    return {
      userId: user.id,
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        '소셜 로그인을 사용한 계정입니다. 비밀번호로 로그인할 수 없습니다.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    const payload = {
      userId: user.id,
      userType: user.userType,
      role: user.role,
      organizationId: user.organizationId,
    };

    const token = this.jwtService.sign(payload);

    return {
      userId: user.id,
      userType: user.userType,
      role: user.role,
      organizationId: user.organizationId,
      token,
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new UnauthorizedException('존재하지 않는 사용자입니다.');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  async validateOAuthLogin(profile: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    profileImage?: string;
  }) {
    // 소셜 로그인 제공자 ID로 사용자 찾기
    let user = await this.userRepository.findOne({
      where: { provider: profile.provider, providerId: profile.providerId },
      relations: ['organization'],
    });

    // 사용자가 없으면 새로 생성
    if (!user) {
      // 이메일로 기존 사용자 확인 (이메일 연동)
      const existingUser = await this.userRepository.findOne({
        where: { email: profile.email },
      });

      if (existingUser) {
        // 기존 사용자에 소셜 로그인 정보 추가
        existingUser.provider = profile.provider;
        existingUser.providerId = profile.providerId;
        if (profile.profileImage) {
          existingUser.profileImage = profile.profileImage;
        }
        user = await this.userRepository.save(existingUser);
      } else {
        // 새 사용자 생성
        user = await this.userRepository.save({
          email: profile.email,
          name: profile.name,
          provider: profile.provider,
          providerId: profile.providerId,
          profileImage: profile.profileImage ?? null,
          password: null, // 소셜 로그인 사용자는 비밀번호 없음
          gender: 'male', // 기본값
          birthYear: 2000, // 기본값
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException('소셜 로그인 처리에 실패했습니다.');
    }

    // JWT 토큰 생성
    const payload = {
      userId: user.id,
      userType: user.userType,
      role: user.role,
      organizationId: user.organizationId,
    };

    const token = this.jwtService.sign(payload);

    return {
      userId: user.id,
      userType: user.userType,
      role: user.role,
      organizationId: user.organizationId,
      token,
    };
  }

  /**
   * 사용자의 LLM API 키를 업데이트합니다.
   * @param userId - 사용자 ID
   * @param provider - LLM Provider (openai, google, anthropic)
   * @param apiKey - API 키 (암호화하여 저장됨)
   * @returns 업데이트된 사용자 정보
   */
  async updateApiKey(
    userId: string,
    provider: LLMProvider,
    apiKey: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // API 키가 비어있으면 해당 Provider 키 삭제
    if (!apiKey || apiKey.trim() === '') {
      const currentKeys = user.llmApiKeys || {};
      const keys = currentKeys as any;
      delete keys[provider];
      user.llmApiKeys = keys;
    } else {
      // API 키를 암호화하여 저장
      const encryptedKey = this.encryptionService.encryptApiKey(apiKey);

      // 기존 API 키 객체 가져오기 (없으면 새로 생성)
      const currentKeys = user.llmApiKeys || {};
      const keys = currentKeys as any;
      keys[provider] = encryptedKey;

      user.llmApiKeys = keys;

      console.log(
        `✅ API 키 저장 완료 - Provider: ${provider}, 암호화된 키 길이: ${encryptedKey.length}`,
      );

      // 복호화 테스트
      try {
        const testDecrypt = this.encryptionService.decryptApiKey(encryptedKey);
        console.log(
          `✅ 복호화 테스트 성공 - 키 시작: ${testDecrypt.substring(0, Math.min(10, testDecrypt.length))}...`,
        );
      } catch (error) {
        console.error(`❌ 복호화 테스트 실패:`, error);
      }
    }

    const savedUser = await this.userRepository.save(user);
    console.log(
      `💾 User 저장 완료 - llmApiKeys: ${JSON.stringify(Object.keys(savedUser.llmApiKeys || {}))}`,
    );
    return savedUser;
  }

  /**
   * 사용자의 모든 LLM API 키를 업데이트합니다.
   * @param userId - 사용자 ID
   * @param apiKeys - API 키 객체 (provider별 키)
   * @returns 업데이트된 사용자 정보
   */
  async updateApiKeys(
    userId: string,
    apiKeys: { openai?: string; google?: string; anthropic?: string },
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 기존 API 키 객체 가져오기 (없으면 새로 생성)
    const currentKeys = user.llmApiKeys || {};
    const keys = currentKeys as any;

    // 각 Provider별로 API 키 업데이트
    for (const [provider, apiKey] of Object.entries(apiKeys)) {
      if (apiKey !== undefined) {
        if (!apiKey || apiKey.trim() === '') {
          // 빈 값이면 해당 키 삭제
          console.log(`🗑️ ${provider} API 키 삭제`);
          delete keys[provider];
        } else {
          // API 키를 암호화하여 저장
          const encryptedKey = this.encryptionService.encryptApiKey(apiKey);
          keys[provider] = encryptedKey;
          console.log(
            `✅ ${provider} API 키 저장 완료 - 암호화된 키 길이: ${encryptedKey.length}`,
          );

          // 복호화 테스트
          try {
            const testDecrypt =
              this.encryptionService.decryptApiKey(encryptedKey);
            console.log(
              `✅ ${provider} 복호화 테스트 성공 - 키 시작: ${testDecrypt.substring(0, Math.min(10, testDecrypt.length))}...`,
            );
          } catch (error) {
            console.error(`❌ ${provider} 복호화 테스트 실패:`, error);
          }
        }
      }
    }

    user.llmApiKeys = keys;
    const savedUser = await this.userRepository.save(user);
    console.log(
      `💾 모든 API 키 저장 완료 - 저장된 Provider: ${JSON.stringify(Object.keys(savedUser.llmApiKeys || {}))}`,
    );
    return savedUser;
  }

  /**
   * 사용자 ID로 사용자 정보를 조회합니다.
   * @param userId - 사용자 ID
   * @returns 사용자 정보
   */
  async getUserById(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'llmApiKeys'],
    });
  }
}
