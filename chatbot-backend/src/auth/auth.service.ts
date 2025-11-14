import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
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
}
