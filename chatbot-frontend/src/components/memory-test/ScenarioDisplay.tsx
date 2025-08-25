import React from "react";

interface ScenarioDisplayProps {
  scenario: {
    setup: string;
    test: string;
    expectedKeywords: string[];
  };
}

export default function ScenarioDisplay({ scenario }: ScenarioDisplayProps) {
  return (
    <div className="bg-white p-3 rounded border border-blue-200 mb-4">
      <div className="text-sm">
        <div className="font-medium text-gray-700 mb-1">📝 입력할 정보:</div>
        <div className="text-gray-600 mb-2">&quot;{scenario.setup}&quot;</div>
        <div className="font-medium text-gray-700 mb-1">❓ 테스트 질문:</div>
        <div className="text-gray-600">&quot;{scenario.test}&quot;</div>
      </div>
    </div>
  );
}
