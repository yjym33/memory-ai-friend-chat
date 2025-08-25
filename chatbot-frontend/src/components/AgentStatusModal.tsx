import React from "react";
import { useAgentStatus } from "../hooks/useAgentStatus";
import GoalProgressSummary from "./agent-status/GoalProgressSummary";
import RecentEmotions from "./agent-status/RecentEmotions";
import ActiveGoals from "./agent-status/ActiveGoals";
import EmotionSummary from "./agent-status/EmotionSummary";

interface AgentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentStatusModal({
  isOpen,
  onClose,
}: AgentStatusModalProps) {
  const { agentStatus, loading, error } = useAgentStatus(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🤖 AI 친구 상태</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 콘텐츠 */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">상태를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-gray-600">{error}</p>
          </div>
        ) : agentStatus ? (
          <div className="space-y-6">
            <GoalProgressSummary goalProgress={agentStatus.goalProgress} />
            <RecentEmotions emotions={agentStatus.recentEmotions} />
            <ActiveGoals goals={agentStatus.activeGoals} />
            <EmotionSummary emotionSummary={agentStatus.emotionSummary} />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">상태 정보를 불러올 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
