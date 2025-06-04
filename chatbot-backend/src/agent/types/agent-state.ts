import { EmotionType } from '../entities/emotion.entity';
import { GoalStatus, GoalCategory } from '../entities/goal.entity';

export interface AgentState {
  userId: number;
  currentMessage: string;

  // 감정 분석 결과
  detectedEmotions: {
    type: EmotionType;
    intensity: number;
    confidence: number;
  }[];

  // 목표 추출 결과
  extractedGoals: {
    title: string;
    category: GoalCategory;
    priority: number;
    targetDate?: string;
  }[];

  // 컨텍스트 정보
  recentEmotions: {
    type: EmotionType;
    intensity: number;
    createdAt: Date;
  }[];

  activeGoals: {
    id: number;
    title: string;
    category: GoalCategory;
    status: GoalStatus;
    progress: number;
    lastCheckedAt?: Date;
  }[];

  // 에이전트 액션
  actions: AgentAction[];

  // 결과
  shouldFollowUp: boolean;
  followUpMessage?: string;
  needsGoalCheck: boolean;
  needsEmotionSupport: boolean;
}

export interface AgentAction {
  type:
    | 'emotion_track'
    | 'goal_extract'
    | 'goal_update'
    | 'follow_up'
    | 'support';
  data: any;
  timestamp: Date;
}

export interface EmotionAnalysisResult {
  emotions: {
    type: EmotionType;
    intensity: number;
    confidence: number;
  }[];
  context?: string;
  trigger?: string;
}

export interface GoalExtractionResult {
  goals: {
    title: string;
    category: GoalCategory;
    priority: number;
    targetDate?: string;
  }[];
  isUpdate: boolean;
  goalId?: number;
}
