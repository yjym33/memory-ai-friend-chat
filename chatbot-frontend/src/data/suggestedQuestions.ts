import { writingData } from "./recommendData/writing";
import { planningData } from "./recommendData/planning";
import { travelData } from "./recommendData/travel";
import { brainstormingData } from "./recommendData/brainstorming";
import { fillTemplate, getRandomItem } from "../utils/templateUtils";

export interface SuggestedQuestion {
  id: string;
  title: string;
  description: string;
  questionGenerator: () => string;
}

export const QUESTION_CATEGORIES: SuggestedQuestion[] = [
  {
    id: "writing-helper",
    title: "글쓰기 도우미",
    description: "각종 문서와 메시지 작성을 도와드립니다",
    questionGenerator: () => {
      const template = getRandomItem(writingData.templates);
      return fillTemplate(template, writingData.variables);
    },
  },
  {
    id: "planning",
    title: "계획 수립",
    description: "목표 달성을 위한 구체적인 계획을 제시합니다",
    questionGenerator: () => {
      const template = getRandomItem(planningData.templates);
      return fillTemplate(template, planningData.variables);
    },
  },
  {
    id: "travel",
    title: "여행 추천",
    description: "맞춤형 여행지와 코스를 추천해드립니다",
    questionGenerator: () => {
      const template = getRandomItem(travelData.templates);
      return fillTemplate(template, travelData.variables);
    },
  },
  {
    id: "brainstorming",
    title: "브레인스토밍",
    description: "창의적인 아이디어 발상을 도와드립니다",
    questionGenerator: () => {
      const template = getRandomItem(brainstormingData.templates);
      return fillTemplate(template, brainstormingData.variables);
    },
  },
];
