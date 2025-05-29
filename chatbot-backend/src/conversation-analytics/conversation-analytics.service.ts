import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../chat/entity/conversation.entity';
import {
  ConversationInsight,
  RelationshipMilestone,
  AnalyticsResult,
} from './types/analytics.types';

@Injectable()
export class ConversationAnalyticsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  // 사용자의 모든 대화 분석
  async analyzeUserConversations(userId: string): Promise<AnalyticsResult> {
    const conversations = await this.conversationRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    const insights: ConversationInsight[] = [];
    const milestones: RelationshipMilestone[] = [];
    const emotionTimeline: { date: string; score: number }[] = [];
    const topicEvolution: {
      [topic: string]: { dates: string[]; frequency: number };
    } = {};

    for (const conversation of conversations) {
      const insight = await this.analyzeConversation(conversation);
      insights.push(insight);

      // 감정 타임라인 생성
      emotionTimeline.push({
        date: conversation.createdAt.toISOString().split('T')[0],
        score: this.calculateEmotionScore(insight.emotion),
      });

      // 주제 진화 추적
      insight.topics.forEach((topic) => {
        if (!topicEvolution[topic]) {
          topicEvolution[topic] = { dates: [], frequency: 0 };
        }
        topicEvolution[topic].dates.push(insight.date);
        topicEvolution[topic].frequency++;
      });

      // 마일스톤 감지
      const milestone = this.detectMilestone(conversation, insight);
      if (milestone) {
        milestones.push(milestone);
      }
    }

    return {
      insights,
      milestones,
      emotionTimeline,
      topicEvolution,
      totalConversations: conversations.length,
      relationshipDuration: this.calculateRelationshipDuration(conversations),
      favoriteTopics: this.getFavoriteTopics(topicEvolution),
      emotionalJourney: this.summarizeEmotionalJourney(emotionTimeline),
    };
  }

  // 개별 대화 분석
  private async analyzeConversation(
    conversation: Conversation,
  ): Promise<ConversationInsight> {
    const messages = conversation.messages || [];
    const userMessages = messages.filter((m) => m.role === 'user');

    // 감정 분석 (간단한 키워드 기반)
    const emotion = this.analyzeEmotion(userMessages);

    // 주제 추출
    const topics = this.extractTopics(userMessages);

    // 키워드 추출
    const keyWords = this.extractKeywords(userMessages);

    return {
      date: conversation.createdAt.toISOString().split('T')[0],
      emotion,
      topics,
      keyWords,
      messageCount: messages.length,
      userInitiated: userMessages.length > 0,
    };
  }

  // 🔥 누락된 키워드 추출 메서드 추가
  private extractKeywords(userMessages: any[]): string[] {
    const allText = userMessages
      .map((m) => m.content)
      .join(' ')
      .toLowerCase();

    // 간단한 키워드 추출 (빈도 기반)
    const words = allText
      .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
      .split(/\s+/)
      .filter((word) => word.length > 1) // 한 글자 단어 제거
      .filter(
        (word) =>
          ![
            '이다',
            '있다',
            '하다',
            '되다',
            '그',
            '그것',
            '저',
            '나',
            '너',
            '우리',
          ].includes(word),
      ); // 불용어 제거

    // 빈도 계산
    const wordCount: { [key: string]: number } = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // 빈도순으로 정렬하여 상위 5개 반환
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  // 감정 분석 (키워드 기반)
  private analyzeEmotion(
    userMessages: any[],
  ): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      '기쁘',
      '행복',
      '좋',
      '성공',
      '감사',
      '최고',
      '완벽',
      '사랑',
      '즐거',
      '만족',
    ];
    const negativeWords = [
      '슬프',
      '우울',
      '힘들',
      '스트레스',
      '실패',
      '화',
      '짜증',
      '걱정',
      '불안',
      '피곤',
    ];

    const allText = userMessages
      .map((m) => m.content)
      .join(' ')
      .toLowerCase();

    const positiveCount = positiveWords.filter((word) =>
      allText.includes(word),
    ).length;
    const negativeCount = negativeWords.filter((word) =>
      allText.includes(word),
    ).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // 주제 추출
  private extractTopics(userMessages: any[]): string[] {
    const topicKeywords = {
      '일/업무': [
        '회사',
        '업무',
        '일',
        '프로젝트',
        '회의',
        '상사',
        '동료',
        '직장',
        '근무',
      ],
      '감정/고민': [
        '고민',
        '걱정',
        '불안',
        '스트레스',
        '힘들',
        '우울',
        '슬프',
        '화',
        '짜증',
      ],
      '취미/여가': [
        '영화',
        '책',
        '게임',
        '운동',
        '여행',
        '음악',
        '요리',
        '드라마',
        '취미',
      ],
      인간관계: [
        '친구',
        '가족',
        '연인',
        '부모님',
        '형제',
        '자매',
        '동료',
        '사람',
      ],
      건강: ['운동', '다이어트', '병원', '건강', '피로', '수면', '아프', '몸'],
      '학습/성장': [
        '공부',
        '시험',
        '자격증',
        '책',
        '강의',
        '배움',
        '학교',
        '성장',
      ],
    };

    const allText = userMessages
      .map((m) => m.content)
      .join(' ')
      .toLowerCase();
    const detectedTopics: string[] = [];

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some((keyword) => allText.includes(keyword))) {
        detectedTopics.push(topic);
      }
    });

    return detectedTopics.length > 0 ? detectedTopics : ['일상'];
  }

  // 마일스톤 감지
  private detectMilestone(
    conversation: Conversation,
    insight: ConversationInsight,
  ): RelationshipMilestone | null {
    const messages = conversation.messages || [];

    // 첫 대화 (ID 기반이 아닌 날짜 기반으로 수정)
    const isFirstConversation =
      insight.date === conversation.createdAt.toISOString().split('T')[0];
    if (isFirstConversation) {
      return {
        date: insight.date,
        type: 'first_conversation',
        title: '첫 만남! 🎉',
        description: '루나와의 첫 대화를 나누었습니다.',
        conversationId: conversation.id,
      };
    }

    // 개인적인 이야기 공유 감지
    const personalKeywords = [
      '가족',
      '꿈',
      '목표',
      '비밀',
      '고민',
      '사랑',
      '걱정',
      '행복',
    ];
    const hasPersonalShare = messages.some(
      (m) =>
        m.role === 'user' &&
        personalKeywords.some((keyword) => m.content.includes(keyword)),
    );

    if (hasPersonalShare) {
      return {
        date: insight.date,
        type: 'personal_share',
        title: '마음을 열었어요 💝',
        description: '개인적인 이야기를 나누며 더 가까워졌습니다.',
        conversationId: conversation.id,
      };
    }

    // 감정적 지원 감지
    if (insight.emotion === 'negative' && insight.messageCount > 5) {
      return {
        date: insight.date,
        type: 'emotional_support',
        title: '힘든 시간을 함께 💪',
        description: '어려운 순간에 서로 의지하며 극복했습니다.',
        conversationId: conversation.id,
      };
    }

    return null;
  }

  private calculateEmotionScore(emotion: string): number {
    switch (emotion) {
      case 'positive':
        return 1;
      case 'negative':
        return -1;
      case 'neutral':
        return 0;
      default:
        return 0;
    }
  }

  private calculateRelationshipDuration(conversations: Conversation[]): number {
    if (conversations.length === 0) return 0;
    const first = conversations[0].createdAt;
    const last = conversations[conversations.length - 1].createdAt;
    return Math.ceil(
      (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  private getFavoriteTopics(
    topicEvolution: any,
  ): { topic: string; count: number }[] {
    return Object.entries(topicEvolution)
      .map(([topic, data]: [string, any]) => ({ topic, count: data.frequency }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private summarizeEmotionalJourney(
    timeline: { date: string; score: number }[],
  ): string {
    if (timeline.length === 0)
      return '아직 충분한 대화가 없어요. 더 많은 이야기를 나눠보세요! 😊';

    const avgScore =
      timeline.reduce((sum, item) => sum + item.score, 0) / timeline.length;

    if (avgScore > 0.3) return '전반적으로 긍정적인 시간들을 보내고 있어요! 😊';
    if (avgScore < -0.3)
      return '힘든 시간들이 많았지만, 함께 극복해나가고 있어요 💪';
    return '평온하고 안정적인 일상을 함께 하고 있어요 😌';
  }
}
