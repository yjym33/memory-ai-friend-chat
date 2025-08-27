import React from "react";
import { getEmotionEmoji } from "../../utils/emojiMaps";

interface EmotionSummaryProps {
  emotionSummary: {
    type: string;
    avgIntensity: string;
    count: string;
  }[];
}

export default function EmotionSummary({
  emotionSummary,
}: EmotionSummaryProps) {
  if (emotionSummary.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        📊 감정 요약 (최근 7일)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {emotionSummary.map((summary, index) => (
          <div key={index} className="bg-white p-3 rounded text-center">
            <div className="text-2xl mb-1">{getEmotionEmoji(summary.type)}</div>
            <div className="font-medium">{summary.type}</div>
            <div className="text-sm text-gray-800">
              평균: {parseFloat(summary.avgIntensity).toFixed(1)}/10
            </div>
            <div className="text-xs text-gray-700">{summary.count}회</div>
          </div>
        ))}
      </div>
    </div>
  );
}
