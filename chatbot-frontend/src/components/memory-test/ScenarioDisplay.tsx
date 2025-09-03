import React from "react";
import { MemoryTestScenario } from "../../data/memoryTestData";

interface ScenarioDisplayProps {
  scenario: MemoryTestScenario;
}

export default function ScenarioDisplay({ scenario }: ScenarioDisplayProps) {
  // 커스텀 시나리오이고 아직 내용이 없는 경우 표시하지 않음
  if (scenario.type === "custom" && (!scenario.setup || !scenario.test)) {
    return null;
  }

  return (
    <div className="bg-white p-3 rounded border border-blue-200 mb-4">
      <div className="text-sm">
        {/* 시나리오 제목 (커스텀인 경우만) */}
        {scenario.type === "custom" &&
          scenario.title &&
          scenario.title !== "사용자 정의 시나리오" && (
            <div className="font-medium text-blue-700 mb-2">
              🎯 {scenario.title}
            </div>
          )}

        <div className="font-medium text-gray-700 mb-1">📝 입력할 정보:</div>
        <div className="text-gray-800 mb-2 bg-gray-50 p-2 rounded">
          &quot;{scenario.setup}&quot;
        </div>

        <div className="font-medium text-gray-700 mb-1">❓ 테스트 질문:</div>
        <div className="text-gray-800 bg-gray-50 p-2 rounded">
          &quot;{scenario.test}&quot;
        </div>

        {/* 기대 키워드 표시 (있는 경우만) */}
        {scenario.expectedKeywords.length > 0 && (
          <div className="mt-3">
            <div className="font-medium text-gray-700 mb-1">
              🎯 기대 키워드:
            </div>
            <div className="flex flex-wrap gap-1">
              {scenario.expectedKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
