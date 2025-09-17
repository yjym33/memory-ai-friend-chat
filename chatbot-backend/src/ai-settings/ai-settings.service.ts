import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiSettings, ChatMode } from './entity/ai-settings.entity';
import {
  CreateAiSettingsDto,
  UpdateAiSettingsDto,
} from './dto/ai-settings.dto';
import { User, UserType, UserRole } from '../auth/entity/user.entity';
import axios from 'axios';

/**
 * AI 설정 관련 비즈니스 로직을 처리하는 서비스
 * 사용자별 AI 설정의 조회, 생성, 업데이트를 담당합니다.
 */
@Injectable()
export class AiSettingsService {
  constructor(
    @InjectRepository(AiSettings)
    private aiSettingsRepository: Repository<AiSettings>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  /**
   * AI 설정을 테스트합니다.
   * @param userId - 사용자 ID
   * @param settings - 테스트할 설정
   * @param message - 테스트 메시지
   * @returns AI 응답
   */
  async testSettings(
    userId: string,
    settings: UpdateAiSettingsDto,
    message: string,
  ): Promise<{ response: string }> {
    console.log(`🧪 사용자 ${userId}의 AI 설정 테스트:`, { settings, message });

    try {
      const systemPrompt = this.generateSystemPrompt(settings);
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다');
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          temperature: 0.8,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const aiResponse =
        response.data.choices?.[0]?.message?.content?.trim() ||
        '응답 생성에 실패했습니다.';

      console.log(`✅ AI 설정 테스트 완료:`, aiResponse);
      return { response: aiResponse };
    } catch (error) {
      console.error('AI 설정 테스트 오류:', error);
      throw new Error('AI 설정 테스트 중 오류가 발생했습니다.');
    }
  }

  /**
   * AI 설정을 기반으로 시스템 프롬프트를 생성합니다.
   * @param settings - AI 설정
   * @returns 시스템 프롬프트
   */
  private generateSystemPrompt(settings: UpdateAiSettingsDto): string {
    let prompt = `너는 AI 친구이다. 다음 설정에 따라 대화해야 한다:\n\n`;

    // 성격 타입
    if (settings.personalityType) {
      const personalityMap: Record<string, string> = {
        친근함: '따뜻하고 친근한 성격으로 대화한다',
        유머러스: '유머러스하고 재미있는 성격으로 대화한다',
        지적: '지적이고 논리적인 성격으로 대화한다',
        차분함: '차분하고 안정적인 성격으로 대화한다',
        활발함: '활발하고 에너지 넘치는 성격으로 대화한다',
      };
      prompt += `- 성격: ${personalityMap[settings.personalityType] || settings.personalityType}\n`;
    }

    // 말투
    if (settings.speechStyle) {
      const styleMap: Record<string, string> = {
        반말: '친근한 반말로 대화한다',
        존댓말: '정중한 존댓말로 대화한다',
        중성: '자연스럽고 중성적인 말투로 대화한다',
      };
      prompt += `- 말투: ${styleMap[settings.speechStyle] || settings.speechStyle}\n`;
    }

    // 이모지 사용
    if (settings.emojiUsage !== undefined) {
      if (settings.emojiUsage >= 4) {
        prompt += `- 이모지를 자주 사용하여 표현력을 높인다\n`;
      } else if (settings.emojiUsage >= 2) {
        prompt += `- 적절히 이모지를 사용한다\n`;
      } else {
        prompt += `- 이모지 사용을 최소화한다\n`;
      }
    }

    // 공감 수준
    if (settings.empathyLevel !== undefined) {
      if (settings.empathyLevel >= 4) {
        prompt += `- 매우 공감적이고 감정적 지지를 많이 제공한다\n`;
      } else if (settings.empathyLevel >= 2) {
        prompt += `- 적절한 수준의 공감과 지지를 제공한다\n`;
      } else {
        prompt += `- 논리적이고 객관적인 관점을 더 중시한다\n`;
      }
    }

    // 닉네임
    if (settings.nickname) {
      prompt += `- 사용자를 "${settings.nickname}"라고 부른다\n`;
    }

    // 관심사 반영
    if (settings.userProfile?.interests?.length > 0) {
      prompt += `- 사용자의 관심사: ${settings.userProfile.interests.join(', ')}\n`;
    }

    prompt += `\n응답은 자연스럽고 일관성 있게 작성해야 한다.`;

    return prompt;
  }

  /**
   * 채팅 모드를 변경합니다.
   */
  async switchChatMode(userId: string, mode: ChatMode): Promise<AiSettings> {
    const settings = await this.findByUserId(userId);
    settings.chatMode = mode;
    return this.aiSettingsRepository.save(settings);
  }

  /**
   * 기업 설정을 업데이트합니다.
   */
  async updateBusinessSettings(
    userId: string,
    businessSettings: AiSettings['businessSettings'],
  ): Promise<AiSettings> {
    const settings = await this.findByUserId(userId);
    settings.businessSettings = {
      ...settings.businessSettings,
      ...businessSettings,
    };
    return this.aiSettingsRepository.save(settings);
  }

  /**
   * 사용자가 사용 가능한 채팅 모드를 조회합니다.
   * 관리자 승인을 받은 기업 계정만 기업 모드 사용 가능
   */
  async getAvailableChatModes(userId: string): Promise<ChatMode[]> {
    // 기본적으로 개인 모드는 모든 사용자가 사용 가능
    const modes = [ChatMode.PERSONAL];

    // 사용자 정보 조회
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      return modes;
    }

    // 기업 모드 사용 가능 조건 확인
    const canUseBusinessMode = this.canUserAccessBusinessMode(user);

    if (canUseBusinessMode) {
      modes.push(ChatMode.BUSINESS);
    }

    return modes;
  }

  /**
   * 사용자가 기업 모드를 사용할 수 있는지 확인합니다.
   */
  private canUserAccessBusinessMode(user: User): boolean {
    // 1. 기업 사용자 타입이어야 함
    if (user.userType !== UserType.BUSINESS) {
      return false;
    }

    // 2. 조직에 속해야 함
    if (!user.organizationId) {
      return false;
    }

    // 3. 관리자 승인을 받았거나, 조직 관리자/슈퍼 관리자인 경우
    const isApproved = user.businessProfile?.businessModeApproved === true;
    const isOrgAdmin = user.role === UserRole.ORG_ADMIN;
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

    return isApproved || isOrgAdmin || isSuperAdmin;
  }

  /**
   * 사용자의 기업 모드 사용을 승인합니다. (관리자만 가능)
   */
  async approveBusinessMode(
    adminUserId: string,
    targetUserId: string,
    reason?: string,
  ): Promise<void> {
    // 관리자 권한 확인
    const admin = await this.userRepository.findOne({
      where: { id: adminUserId },
    });

    if (
      !admin ||
      (admin.role !== UserRole.ORG_ADMIN && admin.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('관리자 권한이 필요합니다.');
    }

    // 대상 사용자 조회 및 승인 처리
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('대상 사용자를 찾을 수 없습니다.');
    }

    // businessProfile 업데이트
    const updatedProfile = {
      ...targetUser.businessProfile,
      businessModeApproved: true,
      approvedBy: adminUserId,
      approvedAt: new Date(),
      approvalReason: reason || '관리자 승인',
    };

    await this.userRepository.update(targetUserId, {
      businessProfile: updatedProfile,
    });
  }
}
