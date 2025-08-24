import React, { useState } from "react";
import { MEMORY_TEST_SCENARIOS } from "../data/memoryTestData";
import axiosInstance from "../utils/axios";
import {
  success as toastSuccess,
  error as toastError,
  warning as toastWarning,
} from "../lib/toast";

interface MemoryTestSectionProps {
  memoryPriorities: {
    personal: number;
    hobby: number;
    work: number;
    emotion: number;
  };
}

export default function MemoryTestSection({
  memoryPriorities,
}: MemoryTestSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    "personal" | "hobby" | "work" | "emotion"
  >("personal");
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);

  const categoryLabels = {
    personal: "개인정보",
    hobby: "취미/관심사",
    work: "업무/학업",
    emotion: "감정상태",
  };

  const currentScenario =
    MEMORY_TEST_SCENARIOS[selectedCategory][selectedScenario];

  // 새 대화방 생성
  const createTestConversation = async () => {
    try {
      const response = await axiosInstance.post("/chat/conversations");
      setConversationId(response.data.id);
      return response.data.id;
    } catch (error) {
      console.error("테스트 대화방 생성 실패:", error);
      return null;
    }
  };

  // 기억할 정보 입력 (Setup)
  const setupMemory = async () => {
    setLoading(true);
    try {
      const chatId = conversationId || (await createTestConversation());
      if (!chatId) return;

      const response = await axiosInstance.post("/chat/completions", {
        conversationId: chatId,
        messages: [{ role: "user", content: currentScenario.setup }],
      });

      if (response.data.choices && response.data.choices.length > 0) {
        setSetupComplete(true);
        toastSuccess("✅ 정보가 입력되었습니다! 이제 기억 테스트를 해보세요.");
      }
    } catch (error) {
      toastError("정보 입력에 실패했습니다.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 기억 테스트 실행
  const testMemory = async () => {
    if (!conversationId) {
      toastWarning("먼저 정보를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/chat/completions", {
        conversationId: conversationId,
        messages: [{ role: "user", content: currentScenario.test }],
      });

      if (response.data.choices && response.data.choices.length > 0) {
        const aiResponse = response.data.choices[0].message.content;
        setTestResult(aiResponse);

        // 키워드 매칭 확인
        const matchedKeywords = currentScenario.expectedKeywords.filter(
          (keyword) => aiResponse.toLowerCase().includes(keyword.toLowerCase())
        );

        console.log(
          `🧠 기억 테스트 결과 - 매칭된 키워드: ${matchedKeywords.length}/${currentScenario.expectedKeywords.length}`
        );
      }
    } catch (error) {
      toastError("기억 테스트에 실패했습니다.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 대화방 삭제 (테스트 초기화)
  const resetTest = async () => {
    if (conversationId) {
      try {
        await axiosInstance.delete(`/chat/conversations/${conversationId}`);
      } catch (error) {
        console.error("대화방 삭제 실패:", error);
      }
    }
    setConversationId(null);
    setSetupComplete(false);
    setTestResult("");
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">🧠 기억 관리 테스트</h3>
        <p className="text-sm text-blue-600 mb-4">
          AI가 설정한 우선순위에 따라 정보를 제대로 기억하는지 테스트해보세요.
        </p>

        {/* 카테고리 선택 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedCategory(
                  key as "personal" | "hobby" | "work" | "emotion"
                );
                resetTest();
              }}
              className={`p-2 rounded text-sm transition ${
                selectedCategory === key
                  ? "bg-blue-200 text-blue-800"
                  : "bg-white text-blue-600 hover:bg-blue-100"
              }`}
            >
              {label} (우선순위:{" "}
              {memoryPriorities[key as keyof typeof memoryPriorities]})
            </button>
          ))}
        </div>

        {/* 시나리오 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-blue-700 mb-1">
            테스트 시나리오:
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => {
              setSelectedScenario(parseInt(e.target.value));
              resetTest();
            }}
            className="w-full p-2 border border-blue-200 rounded"
          >
            {MEMORY_TEST_SCENARIOS[selectedCategory].map((scenario, index) => (
              <option key={index} value={index}>
                시나리오 {index + 1}: {scenario.setup.substring(0, 30)}...
              </option>
            ))}
          </select>
        </div>

        {/* 현재 시나리오 표시 */}
        <div className="bg-white p-3 rounded border border-blue-200 mb-4">
          <div className="text-sm">
            <div className="font-medium text-gray-700 mb-1">
              📝 입력할 정보:
            </div>
            <div className="text-gray-600 mb-2">
              &quot;{currentScenario.setup}&quot;
            </div>
            <div className="font-medium text-gray-700 mb-1">
              ❓ 테스트 질문:
            </div>
            <div className="text-gray-600">
              &quot;{currentScenario.test}&quot;
            </div>
          </div>
        </div>

        {/* 테스트 버튼들 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={setupMemory}
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
            onClick={testMemory}
            disabled={loading || !setupComplete}
            className="flex-1 py-2 px-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {loading ? "테스트 중..." : "2️⃣ 기억 테스트"}
          </button>
          <button
            onClick={resetTest}
            className="py-2 px-3 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            🔄 초기화
          </button>
        </div>

        {/* 테스트 결과 */}
        {testResult && (
          <div className="bg-green-50 border border-green-200 p-3 rounded">
            <div className="font-medium text-green-800 mb-1">🤖 AI 응답:</div>
            <div className="text-green-700 text-sm">{testResult}</div>

            {/* 키워드 매칭 결과 */}
            <div className="mt-2 pt-2 border-t border-green-200">
              <div className="text-xs text-green-600">
                예상 키워드: {currentScenario.expectedKeywords.join(", ")}
              </div>
              <div className="text-xs text-green-600">
                매칭 확인:{" "}
                {currentScenario.expectedKeywords
                  .filter((keyword) =>
                    testResult.toLowerCase().includes(keyword.toLowerCase())
                  )
                  .join(", ") || "없음"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
