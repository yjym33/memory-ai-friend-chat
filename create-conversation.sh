#!/bin/bash

API_BASE_URL="http://localhost:8080"

echo "💬 대화 생성 시작..."
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

# 2. 대화 생성
echo "2️⃣ 대화 생성 중..."
CREATE_CONVERSATION_RESPONSE=$(curl -s -X POST "$API_BASE_URL/chat/conversations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if [[ $CREATE_CONVERSATION_RESPONSE == *"error"* ]]; then
  echo "❌ 대화 생성 실패"
  echo "응답: $CREATE_CONVERSATION_RESPONSE"
  exit 1
fi

echo "✅ 대화 생성 성공"
echo "생성된 대화: $CREATE_CONVERSATION_RESPONSE"
echo ""

echo "🎉 대화 생성 완료!"
