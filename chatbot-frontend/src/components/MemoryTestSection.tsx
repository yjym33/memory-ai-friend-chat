import React from "react";
import { useMemoryTest } from "../hooks/useMemoryTest";
import CategorySelector from "./memory-test/CategorySelector";
import ScenarioSelector from "./memory-test/ScenarioSelector";
import ScenarioDisplay from "./memory-test/ScenarioDisplay";
import TestControls from "./memory-test/TestControls";
import TestResult from "./memory-test/TestResult";

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
  const {
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
  } = useMemoryTest();

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">🧠 기억 관리 테스트</h3>
        <p className="text-sm text-blue-600 mb-4">
          AI가 설정한 우선순위에 따라 정보를 제대로 기억하는지 테스트해보세요.
        </p>

        <CategorySelector
          selectedCategory={selectedCategory}
          memoryPriorities={memoryPriorities}
          onCategoryChange={handleCategoryChange}
        />

        <ScenarioSelector
          selectedCategory={selectedCategory}
          selectedScenario={selectedScenario}
          onScenarioChange={handleScenarioChange}
        />

        <ScenarioDisplay scenario={currentScenario} />

        <TestControls
          loading={loading}
          setupComplete={setupComplete}
          onSetupMemory={setupMemory}
          onTestMemory={testMemory}
          onReset={resetTest}
        />

        <TestResult
          testResult={testResult}
          expectedKeywords={currentScenario.expectedKeywords}
        />
      </div>
    </div>
  );
}
