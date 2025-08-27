#!/bin/bash

API_BASE_URL="http://localhost:8080"

echo "🧪 테마 API 테스트 시작..."
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

# 2. 대화 목록 조회
echo "2️⃣ 대화 목록 조회 중..."
CONVERSATIONS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/chat/conversations" \
  -H "Authorization: Bearer $TOKEN")

CONVERSATION_ID=$(echo $CONVERSATIONS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$CONVERSATION_ID" ]; then
  echo "❌ 대화 목록 조회 실패 또는 대화가 없음"
  echo "응답: $CONVERSATIONS_RESPONSE"
  exit 1
fi

echo "✅ 대화 목록 조회 성공"
echo "📝 테스트할 대화 ID: $CONVERSATION_ID"
echo ""

# 3. 현재 테마 조회
echo "3️⃣ 현재 테마 조회 중..."
CURRENT_THEME_RESPONSE=$(curl -s -X GET "$API_BASE_URL/chat/conversations/$CONVERSATION_ID/theme" \
  -H "Authorization: Bearer $TOKEN")

if [[ $CURRENT_THEME_RESPONSE == *"error"* ]]; then
  echo "ℹ️ 현재 테마가 설정되지 않음 (기본값 사용)"
else
  echo "✅ 현재 테마 조회 성공"
  echo "현재 테마: $CURRENT_THEME_RESPONSE"
fi
echo ""

# 4. 테마 업데이트
echo "4️⃣ 테마 업데이트 중..."
NEW_THEME='{
  "primaryColor": "#10B981",
  "secondaryColor": "#059669",
  "backgroundColor": "#F0FDF4",
  "textColor": "#064E3B",
  "accentColor": "#10B981",
  "userBubbleStyle": {
    "backgroundColor": "linear-gradient(135deg, #10B981, #059669)",
    "textColor": "#FFFFFF",
    "borderRadius": "16px"
  },
  "aiBubbleStyle": {
    "backgroundColor": "#FFFFFF",
    "textColor": "#064E3B",
    "borderRadius": "16px"
  },
  "fontFamily": "Inter, sans-serif",
  "fontSize": "1rem",
  "backgroundImage": "linear-gradient(135deg, #F0FDF4 0%, #D1FAE5 100%)",
  "animations": {
    "messageAppear": true,
    "typingIndicator": true,
    "bubbleHover": true
  }
}'

UPDATE_THEME_RESPONSE=$(curl -s -X PUT "$API_BASE_URL/chat/conversations/$CONVERSATION_ID/theme" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"theme\": $NEW_THEME,
    \"themeName\": \"자연 테마\"
  }")

if [[ $UPDATE_THEME_RESPONSE == *"error"* ]]; then
  echo "❌ 테마 업데이트 실패"
  echo "응답: $UPDATE_THEME_RESPONSE"
  exit 1
fi

echo "✅ 테마 업데이트 성공"
echo "업데이트된 대화: $UPDATE_THEME_RESPONSE"
echo ""

# 5. 업데이트된 테마 조회
echo "5️⃣ 업데이트된 테마 조회 중..."
UPDATED_THEME_RESPONSE=$(curl -s -X GET "$API_BASE_URL/chat/conversations/$CONVERSATION_ID/theme" \
  -H "Authorization: Bearer $TOKEN")

if [[ $UPDATED_THEME_RESPONSE == *"error"* ]]; then
  echo "❌ 업데이트된 테마 조회 실패"
  echo "응답: $UPDATED_THEME_RESPONSE"
  exit 1
fi

echo "✅ 업데이트된 테마 조회 성공"
echo "저장된 테마: $UPDATED_THEME_RESPONSE"
echo ""

echo "🎉 모든 테마 API 테스트 완료!"
