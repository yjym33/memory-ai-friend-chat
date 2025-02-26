export const writingData = {
  templates: [
    "SNS 게시글 작성을 도와주세요. 주제: {topic}",
    "블로그 포스트 작성을 도와주세요. 주제: {topic}",
    "{context}에서 사용할 {format} 작성해주세요.",
    "{purpose}을 위한 {documentType} 작성을 도와주세요.",
  ],
  variables: {
    topic: ["업무 협조 요청", "프로젝트 제안", "경험 공유", "제품 리뷰"],
    context: ["회사", "학교", "거래처", "고객 응대"],
    format: ["보도자료", "공지사항", "회의록", "업무 매뉴얼"],
    purpose: ["이직", "입사 지원", "업무 보고", "제안"],
    documentType: ["자기소개서", "이메일", "기획서", "보고서"],
  },
};
