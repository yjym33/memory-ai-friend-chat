import React from "react";
import { EmotionData } from "../../hooks/useAgentStatus";
import { getEmotionEmoji } from "../../utils/emojiMaps";

interface RecentEmotionsProps {
  emotions: EmotionData[];
}

export default function RecentEmotions({ emotions }: RecentEmotionsProps) {
  return (
    <div className="bg-gradient-to-r from-pink-50 to-red-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        💝 최근 감정 상태
      </h3>
      {emotions.length > 0 ? (
        <div className="space-y-2">
          {emotions.map((emotion) => (
            <div
              key={emotion.id}
              className="flex items-center justify-between bg-white p-3 rounded"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {getEmotionEmoji(emotion.type)}
                </span>
                <div>
                  <div className="font-medium text-gray-900">
                    {emotion.type}
                  </div>
                  <div className="text-sm text-gray-800">
                    강도: {emotion.intensity}/10
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-700">
                {new Date(emotion.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-800">아직 감정 데이터가 없습니다.</p>
      )}
    </div>
  );
}
