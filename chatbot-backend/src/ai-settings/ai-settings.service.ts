import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiSettings } from './entity/ai-settings.entity';
import {
  CreateAiSettingsDto,
  UpdateAiSettingsDto,
} from './dto/ai-settings.dto';

/**
 * AI 설정 관련 비즈니스 로직을 처리하는 서비스
 * 사용자별 AI 설정의 조회, 생성, 업데이트를 담당합니다.
 */
@Injectable()
export class AiSettingsService {
  constructor(
    @InjectRepository(AiSettings)
    private aiSettingsRepository: Repository<AiSettings>,
  ) {}

  /**
   * 사용자의 AI 설정을 조회합니다.
   * 설정이 없는 경우 기본값으로 생성합니다.
   * @param userId - 사용자 ID
   * @returns AI 설정 객체
   */
  async findByUserId(userId: string): Promise<AiSettings> {
    let settings = await this.aiSettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      console.log(`🔧 사용자 ${userId}의 설정이 없어서 기본값으로 생성합니다.`);
      settings = await this.create(userId, {
        personalityType: '친근함',
        speechStyle: '반말',
        emojiUsage: 3,
        empathyLevel: 3,
        memoryRetentionDays: 90,
        memoryPriorities: { personal: 5, hobby: 4, work: 3, emotion: 5 },
        userProfile: { interests: [], currentGoals: [], importantDates: [] },
        avoidTopics: [],
      });
    } else {
      console.log(`✅ 사용자 ${userId}의 현재 설정:`, {
        personalityType: settings.personalityType,
        speechStyle: settings.speechStyle,
        emojiUsage: settings.emojiUsage,
      });
    }

    return settings;
  }

  /**
   * 새로운 AI 설정을 생성합니다.
   * @param userId - 사용자 ID
   * @param createDto - 생성할 설정 데이터
   * @returns 생성된 AI 설정 객체
   */
  async create(
    userId: string,
    createDto: CreateAiSettingsDto,
  ): Promise<AiSettings> {
    const settings = this.aiSettingsRepository.create({
      userId,
      ...createDto,
    });
    return this.aiSettingsRepository.save(settings);
  }

  /**
   * 기존 AI 설정을 업데이트합니다.
   * @param userId - 사용자 ID
   * @param updateDto - 업데이트할 설정 데이터
   * @returns 업데이트된 AI 설정 객체
   */
  async update(
    userId: string,
    updateDto: UpdateAiSettingsDto,
  ): Promise<AiSettings> {
    console.log(`🔄 사용자 ${userId}의 설정 업데이트:`, updateDto);
    await this.aiSettingsRepository.update({ userId }, updateDto);
    const updatedSettings = await this.findByUserId(userId);
    console.log(`✅ 업데이트 완료:`, updatedSettings);
    return updatedSettings;
  }
}
