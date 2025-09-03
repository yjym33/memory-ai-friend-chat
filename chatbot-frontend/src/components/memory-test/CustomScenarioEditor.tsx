import React, { useState } from "react";
import { MemoryTestScenario } from "../../data/memoryTestData";

interface CustomScenarioEditorProps {
  customScenario: MemoryTestScenario;
  onUpdate: (field: keyof MemoryTestScenario, value: any) => void;
  onAddKeyword: (keyword: string) => void;
  onRemoveKeyword: (index: number) => void;
}

export default function CustomScenarioEditor({
  customScenario,
  onUpdate,
  onAddKeyword,
  onRemoveKeyword,
}: CustomScenarioEditorProps) {
  const [newKeyword, setNewKeyword] = useState("");

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      onAddKeyword(newKeyword.trim());
      setNewKeyword("");
    }
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  return (
    <div className="bg-white p-4 rounded border border-blue-200 mb-4">
      <h4 className="font-medium text-blue-800 mb-3">
        🛠️ 사용자 정의 시나리오
      </h4>

      <div className="space-y-4">
        {/* 시나리오 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            시나리오 제목:
          </label>
          <input
            type="text"
            value={customScenario.title}
            onChange={(e) => onUpdate("title", e.target.value)}
            placeholder="예: 내 취미 이야기"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 입력할 정보 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📝 입력할 정보:
          </label>
          <textarea
            value={customScenario.setup}
            onChange={(e) => onUpdate("setup", e.target.value)}
            placeholder="예: 요즘 피아노 배우고 있어. 매일 1시간씩 연습하고 있어."
            rows={3}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 테스트 질문 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ❓ 테스트 질문:
          </label>
          <textarea
            value={customScenario.test}
            onChange={(e) => onUpdate("test", e.target.value)}
            placeholder="예: 내가 요즘 배우고 있는 게 뭐야?"
            rows={2}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 기대 키워드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🎯 기대 키워드:
          </label>
          <div className="space-y-2">
            {/* 키워드 추가 입력 */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
                placeholder="기대하는 키워드 입력"
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                추가
              </button>
            </div>

            {/* 키워드 목록 */}
            {customScenario.expectedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customScenario.expectedKeywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => onRemoveKeyword(index)}
                      className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            AI 응답에서 찾을 것으로 기대하는 키워드들을 입력하세요.
          </p>
        </div>
      </div>

      {/* 유효성 검사 메시지 */}
      {(!customScenario.setup || !customScenario.test) && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-700">
            ⚠️ 정보 입력과 테스트 질문을 모두 작성해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
