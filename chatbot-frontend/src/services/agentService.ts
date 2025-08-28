import { apiClient } from "./apiClient";

export interface Emotion {
  id: number;
  type: string;
  intensity: number;
  context: string;
  createdAt: Date;
}

export interface EmotionSummary {
  type: string;
  avgIntensity: number;
  count: number;
}

export interface AgentStatus {
  recentEmotions: Emotion[];
  activeGoals: Goal[];
  emotionSummary: EmotionSummary[];
  goalProgress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

export interface Milestone {
  id: number;
  goalId: number;
  title: string;
  description?: string;
  status: string;
  targetProgress: number;
  targetDate?: Date;
  achievedAt?: Date;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: string;
  progress: number;
  priority: number;
  targetDate?: Date;
  milestoneData?: string[];
  milestones?: Milestone[];
  lastCheckedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalRecommendation {
  title: string;
  description: string;
  category: string;
  priority: number;
  reason: string;
}

export interface UserGoals {
  goals: Goal[];
  statistics: {
    total: number;
    active: number;
    completed: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  };
  recommendations: GoalRecommendation[];
}

export class AgentService {
  /**
   * 에이전트 상태 조회
   */
  static async getAgentStatus(): Promise<AgentStatus> {
    return apiClient.get<AgentStatus>("/agent/status");
  }

  /**
   * 목표 진행률 업데이트
   */
  static async updateGoalProgress(
    goalId: number,
    progress: number
  ): Promise<{
    success: boolean;
    goal: Goal;
    message: string;
  }> {
    return apiClient.put<{
      success: boolean;
      goal: Goal;
      message: string;
    }>(`/agent/goals/${goalId}/progress`, { progress });
  }

  /**
   * 사용자 목표 조회
   */
  static async getUserGoals(): Promise<UserGoals> {
    return apiClient.get<UserGoals>("/agent/goals");
  }

  /**
   * 목표 삭제
   */
  static async deleteGoal(goalId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/agent/goals/${goalId}`);
  }

  /**
   * 새로운 목표 생성
   */
  static async createGoal(goalData: {
    title: string;
    description?: string;
    category: string;
    priority: number;
  }): Promise<Goal> {
    return apiClient.post<Goal>("/agent/goals", goalData);
  }
}
