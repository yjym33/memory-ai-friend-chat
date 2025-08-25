/**
 * 감정 이모지 매핑 유틸리티
 */
export const getEmotionEmoji = (type: string): string => {
  const emojiMap: { [key: string]: string } = {
    happy: "😊",
    sad: "😢",
    angry: "😠",
    anxious: "😰",
    excited: "🤩",
    frustrated: "😤",
    calm: "😌",
    stressed: "😵",
    confused: "😕",
    proud: "😎",
  };
  return emojiMap[type] || "😐";
};

/**
 * 카테고리 이모지 매핑 유틸리티
 */
export const getCategoryEmoji = (category: string): string => {
  const emojiMap: { [key: string]: string } = {
    health: "💪",
    career: "💼",
    education: "📚",
    relationship: "❤️",
    finance: "💰",
    personal: "🎯",
    hobby: "🎨",
    travel: "✈️",
    other: "📝",
  };
  return emojiMap[category] || "📝";
};
