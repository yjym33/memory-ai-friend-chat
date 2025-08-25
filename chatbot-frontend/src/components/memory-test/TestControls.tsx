import React from "react";

interface TestControlsProps {
  loading: boolean;
  setupComplete: boolean;
  onSetupMemory: () => void;
  onTestMemory: () => void;
  onReset: () => void;
}

export default function TestControls({
  loading,
  setupComplete,
  onSetupMemory,
  onTestMemory,
  onReset,
}: TestControlsProps) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={onSetupMemory}
        disabled={loading || setupComplete}
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
  );
}
