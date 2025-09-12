import React from "react";
import GoalManager from "./GoalManager";

interface GoalManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoalManagerModal({
  isOpen,
  onClose,
}: GoalManagerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">🎯 목표 관리</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto">
          <GoalManager onGoalUpdate={onClose} />
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600 text-center">
            채팅에서 목표를 언급하면 자동으로 목표가 생성됩니다!
          </div>
        </div>
      </div>
    </div>
  );
}
