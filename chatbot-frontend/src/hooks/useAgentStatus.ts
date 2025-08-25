import { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";

export interface EmotionData {
  id: number;
  type: string;
  intensity: number;
  context: string;
  createdAt: string;
}

export interface GoalData {
  id: number;
  title: string;
  category: string;
  status: string;
  progress: number;
  priority: number;
  createdAt: string;
}

export interface AgentStatus {
  recentEmotions: EmotionData[];
  activeGoals: GoalData[];
  emotionSummary: {
    type: string;
    avgIntensity: string;
    count: string;
  }[];
  goalProgress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

/**
 * AI 에이전트 상태 관리를 위한 커스텀 훅
 */
export function useAgentStatus(isOpen: boolean) {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/agent/status");
      setAgentStatus(response.data);
    } catch (err) {
      console.error("에이전트 상태 조회 실패:", err);
      setError("상태 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAgentStatus();
    }
  }, [isOpen]);

  return {
    agentStatus,
    loading,
    error,
    refetch: fetchAgentStatus,
  };
}
