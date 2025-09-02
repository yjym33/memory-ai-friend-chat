import { useState } from "react";
import { MEMORY_TEST_SCENARIOS } from "../data/memoryTestData";
import axiosInstance from "../utils/axios";
import {
  success as toastSuccess,
  error as toastError,
  warning as toastWarning,
} from "../lib/toast";

export type MemoryCategory = "personal" | "hobby" | "work" | "emotion";

/**
 * 메모리 테스트를 위한 커스텀 훅
 */
export function useMemoryTest() {
  const [selectedCategory, setSelectedCategory] =
    useState<MemoryCategory>("personal");
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [loading, setLoading] = useState(false);

  const currentScenario =
    MEMORY_TEST_SCENARIOS[selectedCategory][selectedScenario];

  // 새 대화방 생성
  const createTestConversation = async (): Promise<number | null> => {
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

      const response = await axiosInstance.post(`/chat/completion/${chatId}`, {
        message: currentScenario.setup,
      });

      if (response.data.content) {
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
      const response = await axiosInstance.post(
        `/chat/completion/${conversationId}`,
        {
          message: currentScenario.test,
        }
      );

      if (response.data.content) {
        const aiResponse = response.data.content;
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

  // 카테고리 변경 처리
  const handleCategoryChange = (category: MemoryCategory) => {
    setSelectedCategory(category);
    resetTest();
  };

  // 시나리오 변경 처리
  const handleScenarioChange = (scenarioIndex: number) => {
    setSelectedScenario(scenarioIndex);
    resetTest();
  };

  return {
    selectedCategory,
    selectedScenario,
    currentScenario,
    setupComplete,
    testResult,
    loading,
    setupMemory,
    testMemory,
    resetTest,
    handleCategoryChange,
    handleScenarioChange,
  };
}
