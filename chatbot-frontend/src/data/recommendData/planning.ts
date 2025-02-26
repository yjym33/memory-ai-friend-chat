export const planningData = {
  templates: [
    "{timeframe} 동안의 {activity} 계획을 세워주세요.",
    "{goal}를 달성하기 위한 단계별 계획을 제시해주세요.",
    "{category} 관련 {type} 계획을 작성해주세요.",
    "{context}에 맞는 {aspect} 전략을 수립해주세요.",
  ],
  variables: {
    timeframe: ["1주일", "1개월", "3개월", "6개월", "1년"],
    activity: ["학습", "운동", "독서", "프로젝트", "저축"],
    goal: ["체중 감량", "어학 능력 향상", "자격증 취득", "창업"],
    category: ["자기계발", "건강관리", "재테크", "커리어"],
    type: ["실행", "예산", "일정", "목표"],
    aspect: ["시간 관리", "자원 분배", "위험 관리", "성과 측정"],
    context: ["개인", "팀", "회사", "프로젝트"],
  },
};
