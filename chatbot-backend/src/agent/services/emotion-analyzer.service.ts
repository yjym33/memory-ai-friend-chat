import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Emotion, EmotionType } from '../entities/emotion.entity';

/**
 * 감정 분석 결과 인터페이스
 */
export interface EmotionAnalysisResult {
  emotions: {
    type: EmotionType;
    intensity: number;
    confidence: number;
  }[];
}

/**
 * 감정 요약 정보 인터페이스
 */
export interface EmotionSummary {
  type: string;
  avgIntensity: number;
  count: number;
}

/**
 * Emotion Analyzer Service
 * 메시지에서 감정을 분석하고 감정 데이터를 관리합니다.
 */
@Injectable()
export class EmotionAnalyzerService {
  private readonly logger = new Logger(EmotionAnalyzerService.name);

  // 감정 키워드 매핑
  private readonly emotionKeywords: Record<EmotionType, string[]> = {
    [EmotionType.HAPPY]: [
      '기쁘',
      '행복',
      '좋',
      '즐거',
      '웃',
      '신나',
      '최고',
      '완벽',
      '사랑',
      '감사',
    ],
    [EmotionType.SAD]: [
      '슬프',
      '우울',
      '힘들',
      '괴로',
      '눈물',
      '울',
      '외로',
      '허무',
      '절망',
    ],
    [EmotionType.ANGRY]: [
      '화',
      '짜증',
      '분노',
      '열받',
      '빡치',
      '미치',
      '답답',
      '억울',
    ],
    [EmotionType.ANXIOUS]: [
      '불안',
      '걱정',
      '초조',
      '떨리',
      '두려',
      '무서',
      '긴장',
      '조급',
    ],
    [EmotionType.STRESSED]: [
      '스트레스',
      '피곤',
      '지친',
      '힘든',
      '부담',
      '압박',
      '바쁘',
      '복잡',
    ],
    [EmotionType.EXCITED]: [
      '신나',
      '흥미',
      '기대',
      '설레',
      '재미',
      '즐거',
      '활기',
    ],
    [EmotionType.FRUSTRATED]: [
      '답답',
      '막막',
      '짜증',
      '어려',
      '복잡',
      '헷갈',
    ],
    [EmotionType.CALM]: ['평온', '차분', '안정', '편안', '고요', '평화'],
    [EmotionType.CONFUSED]: ['혼란', '모르', '헷갈', '이해', '복잡', '어렵'],
    [EmotionType.PROUD]: ['자랑', '뿌듯', '자신감', '성취', '해냈', '대단'],
  };

  constructor(
    @InjectRepository(Emotion)
    private emotionRepository: Repository<Emotion>,
  ) {}

  /**
   * 메시지에서 감정을 분석합니다
   * @param message - 분석할 메시지
   * @returns 감정 분석 결과
   */
  analyzeEmotion(message: string): EmotionAnalysisResult {
    this.logger.debug(`감정 분석 시작: "${message.substring(0, 50)}..."`);

    const emotions: {
      type: EmotionType;
      intensity: number;
      confidence: number;
    }[] = [];

    for (const [emotionType, keywords] of Object.entries(this.emotionKeywords)) {
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          emotions.push({
            type: emotionType as EmotionType,
            intensity: Math.floor(Math.random() * 4) + 7, // 7-10 범위 (감지된 경우 높은 강도)
            confidence: 0.8,
          });
          break; // 해당 감정 타입의 첫 번째 매칭만 사용
        }
      }
    }

    // 감정이 감지되지 않은 경우 기본값
    if (emotions.length === 0) {
      emotions.push({
        type: EmotionType.CALM,
        intensity: 5,
        confidence: 0.5,
      });
    }

    this.logger.debug(`감정 분석 완료: ${emotions.length}개 감정 감지됨`);
    return { emotions };
  }

  /**
   * 감정 지원이 필요한지 판단합니다
   * @param emotions - 감정 목록
   * @returns 감정 지원 필요 여부
   */
  needsEmotionSupport(
    emotions: { type: EmotionType; intensity: number }[],
  ): boolean {
    return emotions.some(
      (e) =>
        (e.type === EmotionType.SAD ||
          e.type === EmotionType.ANXIOUS ||
          e.type === EmotionType.STRESSED) &&
        e.intensity >= 7,
    );
  }

  /**
   * 사용자의 최근 감정 이력을 조회합니다
   * @param userId - 사용자 ID
   * @param limit - 조회할 개수
   * @returns 최근 감정 목록
   */
  async getRecentEmotions(userId: string, limit: number = 10): Promise<Emotion[]> {
    return this.emotionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 감정을 저장합니다
   * @param userId - 사용자 ID
   * @param type - 감정 타입
   * @param intensity - 강도
   * @param context - 컨텍스트 (선택)
   * @returns 저장된 감정
   */
  async saveEmotion(
    userId: string,
    type: EmotionType,
    intensity: number,
    context?: string,
  ): Promise<Emotion> {
    const emotion = this.emotionRepository.create({
      userId,
      type,
      intensity,
      context,
    });

    const saved = await this.emotionRepository.save(emotion);
    this.logger.debug(`감정 저장 완료: ${type} (강도: ${intensity})`);
    return saved;
  }

  /**
   * 여러 감정을 한 번에 저장합니다
   * @param userId - 사용자 ID
   * @param emotions - 감정 목록
   * @param context - 컨텍스트 (선택)
   */
  async saveEmotions(
    userId: string,
    emotions: { type: EmotionType; intensity: number }[],
    context?: string,
  ): Promise<void> {
    for (const emotion of emotions) {
      await this.emotionRepository.save({
        userId,
        type: emotion.type,
        intensity: emotion.intensity,
        context,
      });
    }
    this.logger.debug(`${emotions.length}개 감정 저장 완료`);
  }

  /**
   * 감정 요약을 조회합니다 (최근 7일)
   * @param userId - 사용자 ID
   * @returns 감정 요약 목록
   */
  async getEmotionSummary(userId: string): Promise<EmotionSummary[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const summary = await this.emotionRepository
      .createQueryBuilder('emotion')
      .select('emotion.type', 'type')
      .addSelect('AVG(emotion.intensity)', 'avgIntensity')
      .addSelect('COUNT(*)', 'count')
      .where('emotion.userId = :userId', { userId })
      .andWhere('emotion.createdAt >= :weekAgo', { weekAgo })
      .groupBy('emotion.type')
      .getRawMany();

    return summary;
  }

  /**
   * 감정에 따른 지원 메시지를 생성합니다
   * @param emotion - 감정 정보
   * @returns 지원 메시지
   */
  generateSupportMessage(emotion: { type: EmotionType; intensity: number }): string {
    switch (emotion.type) {
      case EmotionType.SAD:
        return '💙 힘든 시간을 겪고 계시는 것 같아요. 언제든 이야기하고 싶으시면 들어드릴게요. 🤗';
      case EmotionType.ANXIOUS:
        return '💙 불안하신 마음이 느껴져요. 깊게 숨을 쉬고 천천히 생각해보시는 건 어떨까요? 🌸';
      case EmotionType.STRESSED:
        return '💙 많은 스트레스를 받고 계시는군요. 잠시 휴식을 취하시는 것도 좋겠어요. ☕';
      case EmotionType.ANGRY:
        return '💙 화가 나시는 상황인 것 같아요. 잠시 심호흡을 하고 진정해보세요. 🌬️';
      case EmotionType.FRUSTRATED:
        return '💙 답답하신 마음이 느껴져요. 함께 해결책을 찾아볼까요? 💪';
      case EmotionType.HAPPY:
        return '🎉 기쁜 일이 있으시군요! 좋은 기운을 나눠주셔서 감사해요! 😊';
      case EmotionType.EXCITED:
        return '✨ 신나는 일이 있으시군요! 그 설렘이 전해져요! 🌟';
      case EmotionType.CONFUSED:
        return '💙 혼란스러우시죠? 함께 정리해볼까요? 차근차근 하나씩 생각해봐요. 🤔';
      case EmotionType.PROUD:
        return '🎉 정말 대단하세요! 자랑스러운 순간을 함께해서 기뻐요! ⭐';
      default:
        return '💙 제가 여기 있으니 걱정하지 마세요. 언제든 편하게 말씀해주세요. 😊';
    }
  }

  /**
   * 최근 감정 데이터를 기반으로 감정 상태를 포맷팅합니다
   * @param emotions - 감정 목록
   * @returns 포맷된 감정 데이터
   */
  formatRecentEmotions(emotions: Emotion[]): {
    type: EmotionType;
    intensity: number;
    createdAt: Date;
  }[] {
    return emotions.map((e) => ({
      type: e.type,
      intensity: e.intensity,
      createdAt: e.createdAt,
    }));
  }
}

