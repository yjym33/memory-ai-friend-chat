import React from "react";
import MemoryTestSection from "../MemoryTestSection";

interface MemorySettingsProps {
  memoryRetentionDays: number;
  memoryPriorities: {
    personal: number;
    hobby: number;
    work: number;
    emotion: number;
  };
  interests: string[];
  onMemoryRetentionDaysChange: (days: number) => void;
  onMemoryPriorityChange: (key: string, value: number) => void;
  onAddInterest: (interest: string) => void;
  onRemoveInterest: (index: number) => void;
}

export default function MemorySettings({
  memoryRetentionDays,
  memoryPriorities,
  interests,
  onMemoryRetentionDaysChange,
  onMemoryPriorityChange,
  onAddInterest,
  onRemoveInterest,
}: MemorySettingsProps) {
  const handleAddInterest = () => {
    const interest = prompt("관심사를 입력하세요:");
    if (interest) {
      onAddInterest(interest);
    }
  };

  return (
    <div className="space-y-6">
      {/* 기억 보존 기간 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          기억 보존 기간 (일)
        </label>
        <select
          value={memoryRetentionDays}
          onChange={(e) =>
            onMemoryRetentionDaysChange(parseInt(e.target.value))
          }
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value={7}>1주일</option>
          <option value={30}>1개월</option>
          <option value={90}>3개월</option>
          <option value={365}>1년</option>
          <option value={999999}>무제한</option>
        </select>
      </div>

      {/* 기억 중요도 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          기억 중요도 설정
        </label>
        <div className="space-y-4">
          {[
            { key: "personal", label: "개인정보 (이름, 가족, 친구)" },
            { key: "hobby", label: "취미/관심사" },
            { key: "work", label: "업무/학업" },
            { key: "emotion", label: "감정상태/고민" },
          ].map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-medium">
                  {memoryPriorities[key as keyof typeof memoryPriorities]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={memoryPriorities[key as keyof typeof memoryPriorities]}
                onChange={(e) =>
                  onMemoryPriorityChange(key, parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 관심사 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            관심사
          </label>
          <button
            onClick={handleAddInterest}
            className="text-purple-600 hover:text-purple-700 text-sm"
          >
            + 추가
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest, index) => (
            <span
              key={index}
              className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {interest}
              <button
                onClick={() => onRemoveInterest(index)}
                className="hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 기억 테스트 섹션 */}
      <MemoryTestSection memoryPriorities={memoryPriorities} />
    </div>
  );
}
