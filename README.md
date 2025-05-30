# 🥇 기억하는 AI 친구 (Persistent Memory Chatbot)

## 📌 프로젝트 개요

**목표**  
사용자와 지속적인 관계를 형성하며, 이전 대화 내용을 기억하고 그에 맞는 응답을 제공하는 **지속형 감성 대화 AI** 개발

**주요 기능**  
- 사용자 정보, 감정 상태, 관심사 등을 기억하고 자연스럽게 반영  
- 자유로운 일상 대화 및 감정 공감 기능  
- 관계 기반의 대화 흐름  
  > 예: “지난번에 피곤하다고 했었지? 좀 나아졌어?”  
- 캐릭터 말투/성격 커스터마이징 기능  

---

## 🧠 구축 전략

### 1. LLM 기반 설계
- OpenAI GPT API 또는 오픈소스 LLM (Mistral, LLaMA 등) 활용
- 사용자별 프롬프트 설정 또는 컨텍스트 리트리버 기반 구조
- 감성 필터링을 통한 위로 및 공감 중심 응답 구성

### 2. 기억 시스템 구조
- Vector DB (예: Weaviate, FAISS, Qdrant)에 유저 발화 및 요약 벡터 저장
- 시간, 주제, 감정 중심의 대화 요약 및 태깅
- 현재 대화에 유의미한 기억만 유사도 기반으로 검색하여 컨텍스트에 반영

---

## 🛠 향후 계획

- 텍스트 기반 챗봇 MVP 제작  
- 대화 요약 및 저장 최적화 알고리즘 개선  
- 유저 감정 분석 및 성격 분류 기능 추가  
- 말투/캐릭터 프리셋 도입  
- 장기 대화 흐름 시각화 및 리뷰 기능  
  > 예: “우리가 나눈 이야기들” 페이지

---

## 📎 기술 스택 (예정)

- **Frontend**: React, TypeScript  
- **Backend**: NestJS, Typeorm
- **LLM**: OpenAI GPT API , Langchain
- **Vector DB**: 미정
- **Infra**: Docker, Vercel / Render / AWS

---

## 현재까지 완성된 홈페이지 화면 (기능 개선 진행중)

![image](https://github.com/user-attachments/assets/c1357076-1676-49ca-897a-11aaa0435163)
![image](https://github.com/user-attachments/assets/31ce4a17-9e2c-4e42-b7ad-77c6167ffeef)
![image](https://github.com/user-attachments/assets/1894051c-7e51-4c53-b15a-a92f3e219fab)
![image](https://github.com/user-attachments/assets/e9261594-ffe8-4fbb-87af-1b3267fe2dbc)
![image](https://github.com/user-attachments/assets/7d93a0d2-c4f8-4985-8954-e786a975515a)




