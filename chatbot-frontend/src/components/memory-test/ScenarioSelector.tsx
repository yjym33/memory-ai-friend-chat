import React from "react";
import { MEMORY_TEST_SCENARIOS } from "../../data/memoryTestData";
import { MemoryCategory, ScenarioType } from "../../hooks/useMemoryTest";

interface ScenarioSelectorProps {
  selectedCategory: MemoryCategory;
  selectedScenario: number;
  scenarioType: ScenarioType;
  onScenarioChange: (scenarioIndex: number) => void;
  onScenarioTypeChange: (type: ScenarioType) => void;
}

export default function ScenarioSelector({
  selectedCategory,
  selectedScenario,
  scenarioType,
  onScenarioChange,
  onScenarioTypeChange,
}: ScenarioSelectorProps) {
  return (
    <div className="mb-4 space-y-3">
      {/* 시나리오 타입 선택 */}
      <div>
        <label className="block text-sm font-medium text-blue-700 mb-2">
          시나리오 유형:
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="scenarioType"
              value="predefined"
              checked={scenarioType === "predefined"}
              onChange={(e) =>
                onScenarioTypeChange(e.target.value as ScenarioType)
              }
              className="mr-2 text-blue-600"
            />
            <span className="text-sm text-gray-700">사전 정의된 시나리오</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="scenarioType"
              value="custom"
              checked={scenarioType === "custom"}
              onChange={(e) =>
                onScenarioTypeChange(e.target.value as ScenarioType)
              }
              className="mr-2 text-blue-600"
            />
            <span className="text-sm text-gray-700">사용자 정의 시나리오</span>
          </label>
        </div>
      </div>

      {/* 사전 정의된 시나리오 선택 */}
      {scenarioType === "predefined" && (
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">
            테스트 시나리오:
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => onScenarioChange(parseInt(e.target.value))}
            className="w-full p-2 border border-blue-200 rounded"
          >
            {MEMORY_TEST_SCENARIOS[selectedCategory].map((scenario, index) => (
              <option key={index} value={index}>
                {scenario.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
