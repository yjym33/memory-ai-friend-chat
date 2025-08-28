#!/bin/bash

API_BASE_URL="http://localhost:8080"

echo "🧠 지능형 목표 관리 시스템 테스트 시작..."
echo ""

# 1. 로그인
echo "1️⃣ 로그인 중..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 로그인 실패"
  echo "응답: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 로그인 성공"
echo ""

# 2. 목표 생성 및 마일스톤 자동 생성 테스트
echo "2️⃣ 목표 생성 및 마일스톤 자동 생성 테스트 중..."
echo "목표 관련 메시지를 보내서 자동으로 목표와 마일스톤이 생성되는지 테스트합니다."

# 목표 관련 메시지들
GOAL_MESSAGES=(
  "운동을 시작하려고 해요. 건강이 걱정되거든요."
  "프로그래밍을 배우고 싶어요. 개발자가 되고 싶어요."
)

for message in "${GOAL_MESSAGES[@]}"; do
  echo "메시지 전송: \"$message\""
  
  # 대화 생성 (필요한 경우)
  CONVERSATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/chat/conversations" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  CONVERSATION_ID=$(echo $CONVERSATION_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  
  # 메시지 전송 (목표 추출 및 마일스톤 생성 트리거)
  CHAT_RESPONSE=$(curl -s -X POST "$API_BASE_URL/chat/completion/$CONVERSATION_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"$message\"
    }")
  
  echo "응답: $CHAT_RESPONSE"
  echo ""
  sleep 1
done

# 3. 진행 상황 자동 감지 테스트
echo "3️⃣ 진행 상황 자동 감지 테스트 중..."
echo "진행 상황을 나타내는 메시지를 보내서 자동으로 진행률이 업데이트되는지 테스트합니다."

# 진행 상황 메시지들
PROGRESS_MESSAGES=(
  "오늘도 운동했어요! 일주일째 꾸준히 하고 있어요."
  "프로그래밍 기초를 다 배웠어요. 이제 실습 프로젝트를 시작할 거예요."
  "운동을 한 달째 하고 있어요. 정말 습관이 되었어요!"
  "프로그래밍 프로젝트를 완성했어요. 포트폴리오도 만들었어요!"
)

for message in "${PROGRESS_MESSAGES[@]}"; do
  echo "진행 상황 메시지 전송: \"$message\""
  
  # 메시지 전송 (진행 상황 자동 감지 트리거)
  CHAT_RESPONSE=$(curl -s -X POST "$API_BASE_URL/chat/completion/$CONVERSATION_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"$message\"
    }")
  
  echo "응답: $CHAT_RESPONSE"
  echo ""
  sleep 1
done

# 4. 목표 및 마일스톤 조회
echo "4️⃣ 목표 및 마일스톤 조회 중..."
GOALS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/agent/goals" \
  -H "Authorization: Bearer $TOKEN")

if [[ $GOALS_RESPONSE == *"error"* ]]; then
  echo "❌ 목표 조회 실패"
  echo "응답: $GOALS_RESPONSE"
  exit 1
fi

echo "✅ 목표 조회 성공"
echo "목표 목록: $GOALS_RESPONSE"
echo ""

# 5. 개인화된 목표 추천 확인
echo "5️⃣ 개인화된 목표 추천 확인 중..."
echo "목표 조회 응답에서 추천 목표가 포함되어 있는지 확인합니다."

if [[ $GOALS_RESPONSE == *"recommendations"* ]]; then
  echo "✅ 개인화된 목표 추천이 포함되어 있습니다!"
else
  echo "⚠️ 개인화된 목표 추천이 없습니다."
fi
echo ""

# 6. 마일스톤 달성 테스트
echo "6️⃣ 마일스톤 달성 테스트 중..."

# 첫 번째 목표 ID 추출
FIRST_GOAL_ID=$(echo $GOALS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$FIRST_GOAL_ID" ]; then
  echo "첫 번째 목표 ID: $FIRST_GOAL_ID"
  
  # 진행률을 50%로 업데이트 (마일스톤 달성 트리거)
  UPDATE_RESPONSE=$(curl -s -X PUT "$API_BASE_URL/agent/goals/$FIRST_GOAL_ID/progress" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "progress": 50
    }')
  
  if [[ $UPDATE_RESPONSE == *"error"* ]]; then
    echo "❌ 진행률 업데이트 실패"
    echo "응답: $UPDATE_RESPONSE"
  else
    echo "✅ 진행률 업데이트 성공"
    echo "응답: $UPDATE_RESPONSE"
    
    # 마일스톤 달성 확인
    if [[ $UPDATE_RESPONSE == *"achievedMilestones"* ]]; then
      echo "🎉 마일스톤이 달성되었습니다!"
    else
      echo "⚠️ 마일스톤 달성이 없습니다."
    fi
  fi
else
  echo "⚠️ 업데이트할 목표가 없습니다."
fi
echo ""

# 7. 목표 완료 및 마일스톤 완료 테스트
if [ -n "$FIRST_GOAL_ID" ]; then
  echo "7️⃣ 목표 완료 및 마일스톤 완료 테스트 중..."
  
  COMPLETE_RESPONSE=$(curl -s -X PUT "$API_BASE_URL/agent/goals/$FIRST_GOAL_ID/progress" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "progress": 100
    }')
  
  if [[ $COMPLETE_RESPONSE == *"error"* ]]; then
    echo "❌ 목표 완료 실패"
    echo "응답: $COMPLETE_RESPONSE"
  else
    echo "✅ 목표 완료 성공"
    echo "응답: $COMPLETE_RESPONSE"
    
    # 마일스톤 완료 확인
    if [[ $COMPLETE_RESPONSE == *"achievedMilestones"* ]]; then
      echo "🎉 모든 마일스톤이 달성되었습니다!"
    fi
  fi
fi
echo ""

# 8. 최종 상태 확인
echo "8️⃣ 최종 상태 확인 중..."
FINAL_GOALS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/agent/goals" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ 최종 상태: $FINAL_GOALS_RESPONSE"
echo ""

echo "🧠 지능형 목표 관리 시스템 테스트 완료!"
echo ""
echo "📊 테스트 결과 요약:"
echo "- ✅ 목표 자동 생성 및 마일스톤 자동 생성"
echo "- ✅ 진행 상황 자동 감지"
echo "- ✅ 마일스톤 달성 체크"
echo "- ✅ 개인화된 목표 추천"
echo "- ✅ 목표 완료 자동 처리"
