import React from "react";
import { Volume2, Pause, Play, X } from "lucide-react";
import { useTTS } from "../hooks/useTTS";

/**
 * TTS 재생 컨트롤 바
 * 음성이 재생 중일 때 화면 하단에 표시되는 컨트롤 바
 */
export default function TTSControlBar() {
  const { isSpeaking, isPaused, pause, resume, stop } = useTTS();

  // 재생 중이 아니면 표시하지 않음
  if (!isSpeaking) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50
                 bg-white dark:bg-gray-800 rounded-full shadow-2xl
                 px-6 py-3 flex items-center gap-4
                 border border-gray-200 dark:border-gray-700
                 animate-slide-up"
    >
      {/* 재생 중 아이콘 */}
      <div className="flex items-center gap-2">
        <Volume2 className="w-5 h-5 text-blue-500 animate-pulse" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          음성 재생 중...
        </span>
      </div>

      {/* 컨트롤 버튼들 */}
      <div className="flex gap-2">
        {/* 일시정지/재개 버튼 */}
        <button
          onClick={isPaused ? resume : pause}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={isPaused ? "재개" : "일시정지"}
          aria-label={isPaused ? "재개" : "일시정지"}
        >
          {isPaused ? (
            <Play className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          ) : (
            <Pause className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          )}
        </button>

        {/* 중지 버튼 */}
        <button
          onClick={stop}
          className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-red-500"
          title="중지"
          aria-label="중지"
        >
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}

