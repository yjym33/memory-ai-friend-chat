#!/bin/bash

API_BASE_URL="http://localhost:8080"

echo "👤 사용자 등록 시작..."
echo ""

# 사용자 등록
echo "1️⃣ 사용자 등록 중..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "테스트 사용자"
  }')

if [[ $REGISTER_RESPONSE == *"error"* ]] || [[ $REGISTER_RESPONSE == *"already exists"* ]]; then
  echo "ℹ️ 사용자가 이미 존재하거나 등록 실패"
  echo "응답: $REGISTER_RESPONSE"
else
  echo "✅ 사용자 등록 성공"
  echo "응답: $REGISTER_RESPONSE"
fi
echo ""

echo "🎉 사용자 등록 완료!"
