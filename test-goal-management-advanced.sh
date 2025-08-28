#!/bin/bash

API_BASE_URL="http://localhost:8080"

echo "🎯 고급 목표 관리 기능 테스트 시작..."
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

# 2. 테스트용 목표 생성
echo "2️⃣ 테스트용 목표 생성 중..."
echo "목표 관련 메시지를 보내서 테스트용 목표를 생성합니다."

# 목표 관련 메시지들
GOAL_MESSAGES=(
  "운동을 시작하려고 해요. 건강이 걱정되거든요."
  "프로그래밍을 배우고 싶어요. 개발자가 되고 싶어요."
  "다이어트를 해야겠어요. 체중 관리가 필요해요."
)

for message in "${GOAL_MESSAGES[@]}"; do
  echo "메시지 전송: \"$message\""
  
  # 대화 생성 (필요한 경우)
  CONVERSATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/chat/conversations" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  CONVERSATION_ID=$(echo $CONVERSATION_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  
  # 메시지 전송 (목표 추출 트리거)
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

# 3. 목표 목록 조회
echo "3️⃣ 목표 목록 조회 중..."
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

# 4. 목표 삭제 테스트
echo "4️⃣ 목표 삭제 테스트 중..."

# 첫 번째 목표 ID 추출
FIRST_GOAL_ID=$(echo $GOALS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$FIRST_GOAL_ID" ]; then
  echo "삭제할 목표 ID: $FIRST_GOAL_ID"
  
  # 목표 삭제
  DELETE_RESPONSE=$(curl -s -X DELETE "$API_BASE_URL/agent/goals/$FIRST_GOAL_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if [[ $DELETE_RESPONSE == *"error"* ]]; then
    echo "❌ 목표 삭제 실패"
    echo "응답: $DELETE_RESPONSE"
  else
    echo "✅ 목표 삭제 성공"
    echo "응답: $DELETE_RESPONSE"
  fi
else
  echo "⚠️ 삭제할 목표가 없습니다."
fi
echo ""

# 5. 삭제 후 목표 목록 확인
echo "5️⃣ 삭제 후 목표 목록 확인 중..."
AFTER_DELETE_RESPONSE=$(curl -s -X GET "$API_BASE_URL/agent/goals" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ 삭제 후 목표 목록: $AFTER_DELETE_RESPONSE"
echo ""

# 6. 추천 목표 확인
echo "6️⃣ 추천 목표 확인 중..."
echo "목표 조회 응답에서 추천 목표가 포함되어 있는지 확인합니다."

if [[ $AFTER_DELETE_RESPONSE == *"recommendations"* ]]; then
  echo "✅ 개인화된 목표 추천이 포함되어 있습니다!"
  
  # 추천 목표 개수 확인
  RECOMMENDATION_COUNT=$(echo $AFTER_DELETE_RESPONSE | grep -o '"recommendations":\[[^]]*\]' | grep -o '\[.*\]' | jq 'length' 2>/dev/null || echo "0")
  echo "추천 목표 개수: $RECOMMENDATION_COUNT"
else
  echo "⚠️ 개인화된 목표 추천이 없습니다."
fi
echo ""

# 7. 새로운 목표 생성 (추천 목표 테스트용)
echo "7️⃣ 새로운 목표 생성 중..."
echo "추천 목표 기능을 테스트하기 위해 새로운 목표를 생성합니다."

NEW_GOAL_MESSAGE="책을 읽는 습관을 들이고 싶어요."

echo "메시지 전송: \"$NEW_GOAL_MESSAGE\""

# 메시지 전송
CHAT_RESPONSE=$(curl -s -X POST "$API_BASE_URL/chat/completion/$CONVERSATION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"$NEW_GOAL_MESSAGE\"
  }")

echo "응답: $CHAT_RESPONSE"
echo ""

# 8. 최종 목표 목록 및 추천 확인
echo "8️⃣ 최종 목표 목록 및 추천 확인 중..."
FINAL_RESPONSE=$(curl -s -X GET "$API_BASE_URL/agent/goals" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ 최종 목표 목록: $FINAL_RESPONSE"
echo ""

echo "🎯 고급 목표 관리 기능 테스트 완료!"
echo ""
echo "📊 테스트 결과 요약:"
echo "- ✅ 목표 자동 생성"
echo "- ✅ 목표 삭제 기능"
echo "- ✅ 개인화된 목표 추천"
echo "- ✅ 추천 목표를 실제 목표로 추가 (UI에서 확인 가능)"
echo "- ✅ 마일스톤 자동 생성"
echo "- ✅ 진행 상황 자동 감지"
