import React from "react";

interface SettingsTestSectionProps {
  selectedTestMessage: string;
  beforeResponse: string;
  afterResponse: string;
  loading: boolean;
  onTestMessageChange: (message: string) => void;
  onTestSettings: () => void;
  onCompareSettings: () => void;
}

export default function SettingsTestSection({
  selectedTestMessage,
  beforeResponse,
  afterResponse,
  loading,
  onTestMessageChange,
  onTestSettings,
  onCompareSettings,
}: SettingsTestSectionProps) {
  return (
    <div className="border-t pt-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4">
        🎭 성격 설정 테스트
      </h3>

      {/* 테스트 메시지 드롭다운 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          테스트 메시지 선택
        </label>
        <select
          value={selectedTestMessage}
          onChange={(e) => onTestMessageChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="">테스트 메시지를 선택하세요</option>
          <option value="오늘 기분이 좀 안 좋아...">감정 테스트: 슬픔</option>
          <option value="새로운 프로젝트를 시작했어!">감정 테스트: 기쁨</option>
          <option value="안녕하세요! 처음 뵙겠습니다">
            말투 테스트: 정중함
          </option>
          <option value="야 뭐해?">말투 테스트: 친근함</option>
        </select>
      </div>

      {/* 비교 결과 UI */}
      {beforeResponse && afterResponse && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-800 mb-1">
              변경 전:
            </div>
            <div className="text-sm text-gray-800">{beforeResponse}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-600 mb-1">
              변경 후:
            </div>
            <div className="text-sm text-gray-800">{afterResponse}</div>
          </div>
        </div>
      )}

      {/* 테스트 버튼들 */}
      <div className="flex gap-2">
        <button
          onClick={onTestSettings}
          disabled={loading}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
        >
          {loading ? "테스트 중..." : "🧪 성격 설정 테스트"}
        </button>
        <button
          onClick={onCompareSettings}
          disabled={loading}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
        >
          {loading ? "비교 중..." : "🔄 변경 전후 비교"}
        </button>
      </div>
    </div>
  );
}
