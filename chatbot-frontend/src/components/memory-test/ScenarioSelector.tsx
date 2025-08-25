import React from "react";
import { MEMORY_TEST_SCENARIOS } from "../../data/memoryTestData";
import { MemoryCategory } from "../../hooks/useMemoryTest";

interface ScenarioSelectorProps {
  selectedCategory: MemoryCategory;
  selectedScenario: number;
  onScenarioChange: (scenarioIndex: number) => void;
}

export default function ScenarioSelector({
  selectedCategory,
  selectedScenario,
  onScenarioChange,
}: ScenarioSelectorProps) {
  return (
    <div className="mb-4">
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
            시나리오 {index + 1}: {scenario.setup.substring(0, 30)}...
          </option>
        ))}
      </select>
    </div>
  );
}
