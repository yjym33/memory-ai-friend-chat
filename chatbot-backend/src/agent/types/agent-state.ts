import { EmotionType } from '../entities/emotion.entity';
import { GoalStatus, GoalCategory } from '../entities/goal.entity';

/**
 * 에이전트 상태 인터페이스
 * 에이전트의 현재 상태와 분석 결과를 담습니다.
 */
export interface AgentState {
  userId: string;
  currentMessage: string;

  // 감정 분석 결과
  detectedEmotions: DetectedEmotion[];

  // 목표 추출 결과
  extractedGoals: ExtractedGoal[];

  // 컨텍스트 정보
  recentEmotions: RecentEmotion[];
  activeGoals: ActiveGoal[];

  // 에이전트 액션
  actions: AgentAction[];

  // 결과
  shouldFollowUp: boolean;
  followUpMessage?: string;
  needsGoalCheck: boolean;
  needsEmotionSupport: boolean;
}

/**
 * 감지된 감정 정보
 */
export interface DetectedEmotion {
  type: EmotionType;
  intensity: number;
  confidence: number;
}

/**
 * 추출된 목표 정보
 */
export interface ExtractedGoal {
  title: string;
  category: GoalCategory;
  priority: number;
  targetDate?: string;
}

/**
 * 최근 감정 정보
 */
export interface RecentEmotion {
  type: EmotionType;
  intensity: number;
  createdAt: Date;
}

/**
 * 활성 목표 정보
 */
export interface ActiveGoal {
  id: number;
  title: string;
  category: GoalCategory;
  status: GoalStatus;
  progress: number;
  lastCheckedAt?: Date;
}

/**
 * 에이전트 액션 타입
 */
export type AgentActionType =
  | 'emotion_track'
  | 'goal_extract'
  | 'goal_update'
  | 'follow_up'
  | 'support';

/**
 * 감정 추적 액션 데이터
 */
export interface EmotionTrackData {
  step?: string;
  emotionsCount?: number;
  goalsCount?: number;
  emotions?: DetectedEmotion[];
}

/**
 * 목표 추출 액션 데이터
 */
export interface GoalExtractData {
  goals: ExtractedGoal[];
  isUpdate: boolean;
  goalId?: number;
}

/**
 * 목표 업데이트 액션 데이터
 */
export interface GoalUpdateData {
  goalId: number;
  progress: number;
  previousProgress?: number;
  reason?: string;
}

/**
 * 팔로업 액션 데이터
 */
export interface FollowUpData {
  shouldFollowUp: boolean;
  needsSupport: boolean;
}

/**
 * 지원 액션 데이터
 */
export interface SupportData {
  message: string;
}

/**
 * 에이전트 액션 데이터 유니온 타입
 */
export type AgentActionData =
  | EmotionTrackData
  | GoalExtractData
  | GoalUpdateData
  | FollowUpData
  | SupportData;

/**
 * 에이전트 액션 인터페이스
 */
export interface AgentAction {
  type: AgentActionType;
  data: AgentActionData;
  timestamp: Date;
}

/**
 * 감정 분석 결과 인터페이스
 */
export interface EmotionAnalysisResult {
  emotions: DetectedEmotion[];
  context?: string;
  trigger?: string;
}

/**
 * 목표 추출 결과 인터페이스
 */
export interface GoalExtractionResult {
  goals: ExtractedGoal[];
  isUpdate: boolean;
  goalId?: number;
}

/**
 * 에이전트 상태 요약 인터페이스
 */
export interface AgentStatusSummary {
  recentEmotions: RecentEmotion[];
  activeGoals: ActiveGoal[];
  emotionSummary: EmotionSummaryItem[];
  goalProgress: GoalProgressSummary;
}

/**
 * 감정 요약 항목
 */
export interface EmotionSummaryItem {
  type: string;
  avgIntensity: number;
  count: number;
}

/**
 * 목표 진행 요약
 */
export interface GoalProgressSummary {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

/**
 * 메모리 우선순위 설정
 */
export interface MemoryPriorities {
  personal?: number;
  emotion?: number;
  work?: number;
  hobby?: number;
  [key: string]: number | undefined;
}

/**
 * 사용자 패턴 분석 결과
 */
export interface UserPatterns {
  preferredCategories: string[];
  averageProgress: number;
  completionRate: number;
  activeGoalsCount: number;
  recentActivity: boolean;
}
