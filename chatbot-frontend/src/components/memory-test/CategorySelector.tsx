import React from "react";
import { MemoryCategory } from "../../hooks/useMemoryTest";

interface CategorySelectorProps {
  selectedCategory: MemoryCategory;
  memoryPriorities: {
    personal: number;
    hobby: number;
    work: number;
    emotion: number;
  };
  onCategoryChange: (category: MemoryCategory) => void;
}

export default function CategorySelector({
  selectedCategory,
  memoryPriorities,
  onCategoryChange,
}: CategorySelectorProps) {
  const categoryLabels = {
    personal: "개인정보",
    hobby: "취미/관심사",
    work: "업무/학업",
    emotion: "감정상태",
  };

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {Object.entries(categoryLabels).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onCategoryChange(key as MemoryCategory)}
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
  );
}
