import React from "react";

interface GoalProgressSummaryProps {
  goalProgress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

export default function GoalProgressSummary({
  goalProgress,
}: GoalProgressSummaryProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        🎯 목표 진행률
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {goalProgress.total}
          </div>
          <div className="text-sm text-gray-800">전체 목표</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {goalProgress.completed}
          </div>
          <div className="text-sm text-gray-800">완료</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {goalProgress.inProgress}
          </div>
          <div className="text-sm text-gray-800">진행 중</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            {goalProgress.notStarted}
          </div>
          <div className="text-sm text-gray-800">시작 전</div>
        </div>
      </div>
    </div>
  );
}
