import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";

interface AgentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmotionData {
  id: number;
  type: string;
  intensity: number;
  context: string;
  createdAt: string;
}

interface GoalData {
  id: number;
  title: string;
  category: string;
  status: string;
  progress: number;
  priority: number;
  createdAt: string;
}

interface AgentStatus {
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

const AgentStatusModal: React.FC<AgentStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAgentStatus();
    }
  }, [isOpen]);

  const fetchAgentStatus = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/agent/status");
      setAgentStatus(response.data);
    } catch (error) {
      console.error("에이전트 상태 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionEmoji = (type: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: "😊",
      sad: "😢",
      angry: "😠",
      anxious: "😰",
      excited: "🤩",
      frustrated: "😤",
      calm: "😌",
      stressed: "😵",
      confused: "😕",
      proud: "😎",
    };
    return emojiMap[type] || "😐";
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      health: "💪",
      career: "💼",
      education: "📚",
      relationship: "❤️",
      finance: "💰",
      personal: "🎯",
      hobby: "🎨",
      travel: "✈️",
      other: "📝",
    };
    return emojiMap[category] || "📝";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🤖 AI 친구 상태</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">상태를 불러오는 중...</p>
          </div>
        ) : agentStatus ? (
          <div className="space-y-6">
            {/* 목표 진행률 요약 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                🎯 목표 진행률
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {agentStatus.goalProgress.total}
                  </div>
                  <div className="text-sm text-gray-600">전체 목표</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {agentStatus.goalProgress.completed}
                  </div>
                  <div className="text-sm text-gray-600">완료</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {agentStatus.goalProgress.inProgress}
                  </div>
                  <div className="text-sm text-gray-600">진행 중</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {agentStatus.goalProgress.notStarted}
                  </div>
                  <div className="text-sm text-gray-600">시작 전</div>
                </div>
              </div>
            </div>

            {/* 최근 감정 */}
            <div className="bg-gradient-to-r from-pink-50 to-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                💝 최근 감정 상태
              </h3>
              {agentStatus.recentEmotions.length > 0 ? (
                <div className="space-y-2">
                  {agentStatus.recentEmotions.map((emotion) => (
                    <div
                      key={emotion.id}
                      className="flex items-center justify-between bg-white p-3 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getEmotionEmoji(emotion.type)}
                        </span>
                        <div>
                          <div className="font-medium">{emotion.type}</div>
                          <div className="text-sm text-gray-600">
                            강도: {emotion.intensity}/10
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(emotion.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">아직 감정 데이터가 없습니다.</p>
              )}
            </div>

            {/* 활성 목표 */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                🎯 활성 목표
              </h3>
              {agentStatus.activeGoals.length > 0 ? (
                <div className="space-y-3">
                  {agentStatus.activeGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-white p-4 rounded border-l-4 border-blue-500"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">
                            {getCategoryEmoji(goal.category)}
                          </span>
                          <span className="font-medium">{goal.title}</span>
                        </div>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {goal.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-sm text-gray-600">
                        <span>우선순위: {goal.priority}/10</span>
                        <span>
                          {new Date(goal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">아직 설정된 목표가 없습니다.</p>
              )}
            </div>

            {/* 감정 요약 */}
            {agentStatus.emotionSummary.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  📊 감정 요약 (최근 7일)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {agentStatus.emotionSummary.map((summary, index) => (
                    <div
                      key={index}
                      className="bg-white p-3 rounded text-center"
                    >
                      <div className="text-2xl mb-1">
                        {getEmotionEmoji(summary.type)}
                      </div>
                      <div className="font-medium">{summary.type}</div>
                      <div className="text-sm text-gray-600">
                        평균: {parseFloat(summary.avgIntensity).toFixed(1)}/10
                      </div>
                      <div className="text-xs text-gray-500">
                        {summary.count}회
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">상태 정보를 불러올 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentStatusModal;
