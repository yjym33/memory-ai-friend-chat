import React from "react";
import { GoalData } from "../../hooks/useAgentStatus";
import { getCategoryEmoji } from "../../utils/emojiMaps";

interface ActiveGoalsProps {
  goals: GoalData[];
}

export default function ActiveGoals({ goals }: ActiveGoalsProps) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">🎯 활성 목표</h3>
      {goals.length > 0 ? (
        <div className="space-y-3">
          {goals.map((goal) => (
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
                <span className="text-sm font-medium">{goal.progress}%</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-800">
                <span>우선순위: {goal.priority}/10</span>
                <span>{new Date(goal.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-800">아직 설정된 목표가 없습니다.</p>
      )}
    </div>
  );
}
