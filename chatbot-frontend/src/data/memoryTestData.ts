// 시나리오 타입 정의
export interface MemoryTestScenario {
  id: string;
  title: string;
  setup: string;
  test: string;
  expectedKeywords: string[];
  type: "predefined" | "custom";
}

// 사전 정의된 시나리오들
export const PREDEFINED_MEMORY_SCENARIOS = {
  personal: [
    {
      id: "personal-1",
      title: "개인 정보 (직업)",
      setup: "안녕! 내 이름은 김철수야. 올해 28살이고 개발자로 일하고 있어.",
      test: "내 직업이 뭐였지?",
      expectedKeywords: ["개발자", "프로그래머", "엔지니어"],
      type: "predefined" as const,
    },
    {
      id: "personal-2",
      title: "가족 구성원",
      setup: "우리 가족은 부모님이랑 여동생이 있어. 여동생은 대학생이야.",
      test: "내 가족 구성원에 대해 기억하고 있어?",
      expectedKeywords: ["부모님", "여동생", "대학생", "가족"],
      type: "predefined" as const,
    },
  ],
  hobby: [
    {
      id: "hobby-1",
      title: "악기 연주",
      setup: "요즘 기타 배우고 있어. 아직 초보지만 정말 재미있어!",
      test: "내가 요즘 배우고 있는 게 뭐야?",
      expectedKeywords: ["기타", "음악", "악기"],
      type: "predefined" as const,
    },
    {
      id: "hobby-2",
      title: "주말 활동",
      setup: "주말마다 등산을 가는 게 취미야. 벌써 3년째 하고 있어.",
      test: "내 주말 취미 활동이 뭐였지?",
      expectedKeywords: ["등산", "산", "주말"],
      type: "predefined" as const,
    },
  ],
  work: [
    {
      id: "work-1",
      title: "업무 일정",
      setup: "다음 달에 중요한 프레젠테이션이 있어. 정말 긴장돼.",
      test: "내가 다음 달에 해야 할 중요한 일이 뭐야?",
      expectedKeywords: ["프레젠테이션", "발표", "중요한"],
      type: "predefined" as const,
    },
    {
      id: "work-2",
      title: "직장 변화",
      setup: "새로운 팀장님이 오셨는데 아직 어색해. 적응하는 게 쉽지 않네.",
      test: "내 직장에서 최근에 변화가 있었던 게 뭐야?",
      expectedKeywords: ["팀장", "새로운", "변화"],
      type: "predefined" as const,
    },
  ],
  emotion: [
    {
      id: "emotion-1",
      title: "부정적 감정",
      setup: "오늘 정말 힘든 하루였어. 일이 잘 안 풀려서 스트레스받았어.",
      test: "내가 오늘 어떤 기분이었는지 기억해?",
      expectedKeywords: ["힘든", "스트레스", "안 좋은", "어려운"],
      type: "predefined" as const,
    },
    {
      id: "emotion-2",
      title: "긍정적 감정",
      setup: "드디어 승진이 확정됐어! 정말 기뻐서 잠이 안 와.",
      test: "내게 최근에 좋은 일이 있었는데 기억나?",
      expectedKeywords: ["승진", "기쁜", "좋은 일", "확정"],
      type: "predefined" as const,
    },
  ],
};

// 커스텀 시나리오 템플릿
export const CUSTOM_SCENARIO_TEMPLATE: MemoryTestScenario = {
  id: "custom",
  title: "사용자 정의 시나리오",
  setup: "",
  test: "",
  expectedKeywords: [],
  type: "custom",
};

// 하위 호환성을 위한 기존 데이터 구조 유지
export const MEMORY_TEST_SCENARIOS = PREDEFINED_MEMORY_SCENARIOS;
