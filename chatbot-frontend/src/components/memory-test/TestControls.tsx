import React from "react";
import { MemoryTestScenario } from "../../data/memoryTestData";

interface TestControlsProps {
  loading: boolean;
  setupComplete: boolean;
  currentScenario: MemoryTestScenario;
  onSetupMemory: () => void;
  onTestMemory: () => void;
  onReset: () => void;
}

export default function TestControls({
  loading,
  setupComplete,
  currentScenario,
  onSetupMemory,
  onTestMemory,
  onReset,
}: TestControlsProps) {
  // 시나리오 유효성 검사
  const isScenarioValid =
    currentScenario.setup.trim() && currentScenario.test.trim();
  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-4">
        <button
          onClick={onSetupMemory}
          disabled={loading || setupComplete || !isScenarioValid}
          className="flex-1 py-2 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading
            ? "입력 중..."
            : setupComplete
            ? "✅ 정보 입력 완료"
            : "1️⃣ 정보 입력하기"}
        </button>
        <button
          onClick={onTestMemory}
          disabled={loading || !setupComplete}
          className="flex-1 py-2 px-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          {loading ? "테스트 중..." : "2️⃣ 기억 테스트"}
        </button>
        <button
          onClick={onReset}
          className="py-2 px-3 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          🔄 초기화
        </button>
      </div>

      {/* 유효성 검사 메시지 */}
      {!isScenarioValid && currentScenario.type === "custom" && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="text-yellow-700">
            ⚠️ 정보 입력과 테스트 질문을 모두 작성해야 테스트를 시작할 수
            있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
