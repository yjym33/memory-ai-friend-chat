# 🥇 기획서 ① – 기억하는 AI 친구 (Persistent Memory Chatbot)

## 1. 프로젝트 개요

### 🎯 목표
사용자와 지속적인 관계를 형성하며,  
이전 대화 내용을 기억하고 그에 맞는 응답을 제공하는 **지속형 감성 대화 AI** 개발

### 🧩 주요 기능
- 사용자 정보, 감정 상태, 관심사 등을 기억하고 자연스럽게 반영
- 자유로운 일상 대화와 감정 공감
- 관계 기반의 대화 흐름  
  (예: _“지난번에 피곤하다고 했었지? 좀 나아졌어?”_)
- 캐릭터 말투/성격 커스터마이징 기능

---

## 2. 구축 전략

### 2-1. 🧠 LLM 기반 설계
- OpenAI GPT API 또는 오픈소스 LLM (Mistral, LLaMA 등) 활용
- 사용자별 프롬프트 설정 또는 **컨텍스트 리트리버 기반 기억 삽입**
- 감성 필터링을 통한 위로, 공감 중심의 응답 구성

### 2-2. 🗂 기억 시스템 구조
- Vector DB (Weaviate, FAISS, Qdrant 등)에 유저 발화 및 요약 임베딩 저장
- 시간, 주제, 감정 중심으로 대화 요약/태깅
- 현재 대화와 유의미한 기억만 **유사도 기반으로 검색하여 삽입**

### 2-3. 💬 대화 흐름 최적화
- LangChain 기반 **메모리 체인 구조** 적용
- 유저 프로필 + 대화 이력을 기반으로 자동 성격 분석 or 프롬프트 조정
- ‘기억에 남는 일’이나 ‘중요한 대화’는 **수동 저장 기능** 고려

---

## 3. 🛠 기술 스택 (예정)

| 범주       | 기술 스택                                       |
|------------|------------------------------------------------|
| **LLM**    | OpenAI GPT, Mistral, LLaMA                     |
| **Vector DB** | FAISS, Weaviate                              |
| **Embedding** | OpenAI Embedding, BGE, E5                    |
| **Agent**  | LangChain, LangGraph                           |
| **Frontend** | React, Next.js                               |
| **Backend** | NestJS                                        |
| **Database** | PostgreSQL                                   |
| **ORM**    | TypeORM                                        |

---

## 4. ✅ 기대 효과

- “**인간처럼 기억하는 AI 친구**” UX 실현
- 단순 대화형 챗봇보다 깊이 있는 사용자 경험 제공
- 개인화된 감정 AI 경험 → **높은 사용자 재방문 유도**
- 개인화 기술/메모리 관리 기술 역량 어필 가능

---

## 5. 🔮 향후 계획

- 텍스트 기반 챗봇 MVP 제작
- 대화 요약/저장 최적화 알고리즘 개선
- 유저 감정 분석 및 성격 분류 기능 추가
- 말투/캐릭터 프리셋 도입
- 장기 대화 흐름 시각화 및 리뷰 기능  
  _(ex. “우리가 나눈 이야기들” 페이지)_

---

## 6. 🧭 에이전트 기능 설계 – **라이프 코치 에이전트 (Life Coach Agent)**

### 🎯 도입 배경
기억 기반 챗봇이 단순 응답을 넘어,  
**사용자의 삶에 개입하고 정서적으로 챙겨주는 조력자 역할**을 수행하면  
‘AI 친구’의 몰입도를 훨씬 높일 수 있습니다.  
이를 위해 **LangGraph 기반 상태 머신 구조**로 에이전트를 설계합니다.

---

### 🧩 핵심 역할

- 사용자의 **목표 / 루틴 / 습관**을 기억하고 주기적으로 점검
- 감정 상태 변화에 따라 **챙김 / 격려 / 위로 제공**
- 중요한 대화/목표에 대해 **follow-up 생성**

---

### 📈 기능 구성 (예정)

| 기능 범주       | 설명                                                                 |
|----------------|----------------------------------------------------------------------|
| **목표 추적**     | “다이어트 시작할 거야” → `goal: 다이어트` 로 저장                      |
| **감정 모니터링** | “요즘 너무 힘들어” → `emotion: sad` 저장 + follow-up 생성            |
| **챙김 응답**     | 일정 시점 이후 자동 follow-up 대화 생성                              |
| **관계 유지**     | “저번에 말한 시험 준비 잘 되고 있어?” 등 기억 기반 피드백 제공         |

---

### 🧠 LangGraph 흐름 구성

- 각 노드는 LangGraph에서 **상태(State)** 로 정의
- 유저 Intent에 따라 **조건 분기**
- 기억된 목표/감정/루틴 상태를 기반으로 챗봇 응답 및 챙김 동작 자동 생성

---

### 🗣️ 예시 대화 흐름

> 🧍 “다이어트 시작했어.”  
> 🤖 “응원할게! 언제까지 목표야?”  
>  
> (3일 후)  
> 🤖 “요즘 식단 잘 지키고 있어? 혹시 도와줄 거 있을까?”

---

### 🧱 기술 구성 요약 (예정)

| 범주            | 구성 요소                               |
|----------------|----------------------------------------|
| **LLM**         | GPT-4, Mistral                         |
| **Agent**       | LangGraph (상태 기반 흐름 처리)         |
| **Memory DB**   | Weaviate, Qdrant                       |
| **Embedding**   | OpenAI Embedding, BGE                  |
| **스케줄링**     | Internal CRON / Temporal               |
| **대화 관리**    | LangChain + NestJS API 연동             |

---

### 🌱 확장 방향

- 사용자 루틴 진척도 **대시보드 시각화**
- 감정 변화 **트래킹 그래프** 제공
- 장기 대화 히스토리 기반 **추천/격려 기능** 추가

---

### 구현중인 이미지 

![image](https://github.com/user-attachments/assets/e2a96006-f6c8-41b8-b844-adb1eb289e26)

![image](https://github.com/user-attachments/assets/97e2687f-2ba7-4b5f-94ad-e2d3625d3e0b)

![image](https://github.com/user-attachments/assets/51b6600b-2f05-4ffe-afa0-db4dc9645664)

![image](https://github.com/user-attachments/assets/f37964e4-b01a-4628-958d-b68dc37c0d94)

![image](https://github.com/user-attachments/assets/22928d15-0503-4918-9f88-56097d5f4cd8)

![image](https://github.com/user-attachments/assets/5ff4b6b0-0909-4a8f-a284-0bc4e2018b17)

![image](https://github.com/user-attachments/assets/65caa247-8a86-4299-8e94-74e4f7db703e)

![image](https://github.com/user-attachments/assets/290de072-d6f1-4857-9ce0-e7990a24ec93)


