#!/bin/bash

API_BASE_URL="http://localhost:8080"

echo "🎯 목표 관리 시스템 테스트 시작..."
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

# 2. 목표 추출 테스트 (채팅 메시지로 목표 생성)
echo "2️⃣ 목표 추출 테스트 중..."
echo "목표 관련 메시지를 보내서 자동으로 목표가 생성되는지 테스트합니다."

# 목표 관련 메시지들
GOAL_MESSAGES=(
  "운동을 시작하려고 해요. 건강이 걱정되거든요."
  "프로그래밍을 배우고 싶어요. 개발자가 되고 싶어요."
  "다이어트를 해야겠어요. 체중 관리가 필요해요."
  "책을 읽는 습관을 들이고 싶어요."
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

# 3. 사용자 목표 조회
echo "3️⃣ 사용자 목표 조회 중..."
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

# 4. 목표 진행률 업데이트 테스트
echo "4️⃣ 목표 진행률 업데이트 테스트 중..."

# 첫 번째 목표 ID 추출
FIRST_GOAL_ID=$(echo $GOALS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$FIRST_GOAL_ID" ]; then
  echo "첫 번째 목표 ID: $FIRST_GOAL_ID"
  
  # 진행률을 50%로 업데이트
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
  fi
else
  echo "⚠️ 업데이트할 목표가 없습니다."
fi
echo ""

# 5. 목표를 100%로 완료
if [ -n "$FIRST_GOAL_ID" ]; then
  echo "5️⃣ 목표 완료 테스트 중..."
  
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
  fi
fi
echo ""

# 6. 최종 목표 상태 확인
echo "6️⃣ 최종 목표 상태 확인 중..."
FINAL_GOALS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/agent/goals" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ 최종 목표 상태: $FINAL_GOALS_RESPONSE"
echo ""

echo "🎉 목표 관리 시스템 테스트 완료!"
