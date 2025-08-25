import React from "react";

interface PersonalitySettingsProps {
  personalityType: string;
  speechStyle: string;
  nickname: string;
  emojiUsage: number;
  empathyLevel: number;
  onPersonalityTypeChange: (type: string) => void;
  onSpeechStyleChange: (style: string) => void;
  onNicknameChange: (nickname: string) => void;
  onEmojiUsageChange: (usage: number) => void;
  onEmpathyLevelChange: (level: number) => void;
}

export default function PersonalitySettings({
  personalityType,
  speechStyle,
  nickname,
  emojiUsage,
  empathyLevel,
  onPersonalityTypeChange,
  onSpeechStyleChange,
  onNicknameChange,
  onEmojiUsageChange,
  onEmpathyLevelChange,
}: PersonalitySettingsProps) {
  return (
    <div className="space-y-6">
      {/* 성격 유형 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          성격 유형
        </label>
        <div className="grid grid-cols-2 gap-2">
          {["친근함", "차분함", "활발함", "따뜻함"].map((type) => (
            <button
              key={type}
              onClick={() => onPersonalityTypeChange(type)}
              className={`p-3 rounded-lg border transition ${
                personalityType === type
                  ? "bg-purple-100 border-purple-500 text-purple-700"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 말투 스타일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          말투 스타일
        </label>
        <div className="grid grid-cols-2 gap-2">
          {["격식체", "반말"].map((style) => (
            <button
              key={style}
              onClick={() => onSpeechStyleChange(style)}
              className={`p-3 rounded-lg border transition ${
                speechStyle === style
                  ? "bg-purple-100 border-purple-500 text-purple-700"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* 별명 설정 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI가 나를 부르는 별명 (선택사항)
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => onNicknameChange(e.target.value)}
          placeholder="예: 친구, 동료, 이름 등"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* 이모티콘 사용량 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이모티콘 사용량: {emojiUsage}
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={emojiUsage}
          onChange={(e) => onEmojiUsageChange(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>적게</span>
          <span>많이</span>
        </div>
      </div>

      {/* 공감 수준 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          공감 표현 수준: {empathyLevel}
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={empathyLevel}
          onChange={(e) => onEmpathyLevelChange(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>차분한 공감</span>
          <span>적극적 공감</span>
        </div>
      </div>
    </div>
  );
}
