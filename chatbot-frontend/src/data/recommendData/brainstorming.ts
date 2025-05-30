export const brainstormingData = {
  templates: [
    "{industry} 산업에서 {trend}를 활용한 새로운 비즈니스 아이디어를 {count}개 제안해주세요.",
    "{target}을 위한 {service} 서비스의 {aspect} 아이디어를 브레인스토밍 해주세요.",
    "{problem} 문제를 해결하기 위한 창의적인 해결방안을 제시해주세요.",
    "{field}분야의 {innovation} 혁신 사례를 참고하여 새로운 아이디어를 제안해주세요.",
  ],
  variables: {
    industry: ["IT", "교육", "의료", "금융", "유통", "환경", "문화"],
    trend: ["AI", "메타버스", "블록체인", "IoT", "친환경", "구독경제"],
    count: ["3", "5", "7", "10"],
    target: ["MZ세대", "시니어", "학생", "직장인", "자영업자"],
    service: ["모바일앱", "플랫폼", "커뮤니티", "교육", "결제"],
    aspect: ["수익화", "마케팅", "사용자경험", "차별화", "확장성"],
    problem: ["환경오염", "교통체증", "식품낭비", "주거문제", "교육격차"],
    field: ["테크", "리테일", "헬스케어", "교육", "모빌리티"],
    innovation: ["공유경제", "개인화", "자동화", "디지털전환", "플랫폼"],
  },
};
