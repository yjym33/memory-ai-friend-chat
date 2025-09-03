import React from "react";
import { useMemoryTest } from "../hooks/useMemoryTest";
import CategorySelector from "./memory-test/CategorySelector";
import ScenarioSelector from "./memory-test/ScenarioSelector";
import CustomScenarioEditor from "./memory-test/CustomScenarioEditor";
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
    scenarioType,
    customScenario,
    currentScenario,
    setupComplete,
    testResult,
    loading,
    setupMemory,
    testMemory,
    resetTest,
    handleCategoryChange,
    handleScenarioChange,
    handleScenarioTypeChange,
    updateCustomScenario,
    addCustomKeyword,
    removeCustomKeyword,
  } = useMemoryTest();

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">🧠 기억 관리 테스트</h3>
        <p className="text-sm text-blue-600 mb-4">
          AI가 설정한 우선순위에 따라 정보를 제대로 기억하는지 테스트해보세요.
        </p>

        {/* 카테고리 선택 (사전 정의된 시나리오인 경우만) */}
        {scenarioType === "predefined" && (
          <CategorySelector
            selectedCategory={selectedCategory}
            memoryPriorities={memoryPriorities}
            onCategoryChange={handleCategoryChange}
          />
        )}

        {/* 시나리오 선택 */}
        <ScenarioSelector
          selectedCategory={selectedCategory}
          selectedScenario={selectedScenario}
          scenarioType={scenarioType}
          onScenarioChange={handleScenarioChange}
          onScenarioTypeChange={handleScenarioTypeChange}
        />

        {/* 커스텀 시나리오 편집기 */}
        {scenarioType === "custom" && (
          <CustomScenarioEditor
            customScenario={customScenario}
            onUpdate={updateCustomScenario}
            onAddKeyword={addCustomKeyword}
            onRemoveKeyword={removeCustomKeyword}
          />
        )}

        {/* 시나리오 미리보기 */}
        <ScenarioDisplay scenario={currentScenario} />

        <TestControls
          loading={loading}
          setupComplete={setupComplete}
          currentScenario={currentScenario}
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
