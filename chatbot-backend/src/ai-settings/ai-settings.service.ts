import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiSettings } from './entity/ai-settings.entity';
import {
  CreateAiSettingsDto,
  UpdateAiSettingsDto,
} from './dto/ai-settings.dto';

@Injectable()
export class AiSettingsService {
  constructor(
    @InjectRepository(AiSettings)
    private aiSettingsRepository: Repository<AiSettings>,
  ) {}

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

  async update(
    userId: string,
    updateDto: UpdateAiSettingsDto,
  ): Promise<AiSettings> {
    console.log(`�� 사용자 ${userId}의 설정 업데이트:`, updateDto);
    await this.aiSettingsRepository.update({ userId }, updateDto);
    const updatedSettings = await this.findByUserId(userId);
    console.log(`✅ 업데이트 완료:`, updatedSettings);
    return updatedSettings;
  }
}
