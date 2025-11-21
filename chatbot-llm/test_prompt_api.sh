#!/bin/bash

# chatbot-llm 서비스 API 테스트 스크립트
# 프롬프트 생성 및 메모리 관리 API를 테스트합니다.

SERVER_URL="http://localhost:3002"

echo "========================================="
echo "chatbot-llm 서비스 API 테스트"
echo "========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 헬스 체크
echo -e "${YELLOW}[1/4] 헬스 체크${NC}"
echo "GET ${SERVER_URL}/health"
response=$(curl -s -w "\n%{http_code}" "${SERVER_URL}/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ 헬스 체크 성공 (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ 헬스 체크 실패 (HTTP $http_code)${NC}"
    echo "$body"
    exit 1
fi
echo ""

# 프롬프트 생성 테스트
echo -e "${YELLOW}[2/4] 프롬프트 생성 API 테스트${NC}"
echo "POST ${SERVER_URL}/api/v1/prompt"
response=$(curl -s -w "\n%{http_code}" -X POST "${SERVER_URL}/api/v1/prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "conversationId": "test_conv_456",
    "message": "안녕하세요! 오늘 날씨가 좋네요.",
    "aiSettings": {
      "personalityType": "친근함",
      "speechStyle": "반말",
      "emojiUsage": 3,
      "empathyLevel": 4,
      "nickname": "친구"
    },
    "maxContextMessages": 6
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ 프롬프트 생성 성공 (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    # 응답에서 필수 필드 확인
    if echo "$body" | jq -e '.systemPrompt' > /dev/null 2>&1 && \
       echo "$body" | jq -e '.messages' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 응답 형식 검증 성공${NC}"
    else
        echo -e "${RED}✗ 응답 형식 검증 실패${NC}"
    fi
else
    echo -e "${RED}✗ 프롬프트 생성 실패 (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# 메모리 저장 테스트
echo -e "${YELLOW}[3/4] 메모리 저장 API 테스트${NC}"
echo "POST ${SERVER_URL}/api/v1/memory"
response=$(curl -s -w "\n%{http_code}" -X POST "${SERVER_URL}/api/v1/memory" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "conversationId": "test_conv_456",
    "userMessage": "안녕하세요! 오늘 날씨가 좋네요.",
    "assistantMessage": "안녕! 오늘 날씨 정말 좋지? 밖에 나가고 싶어지는 날씨네 😊",
    "importance": 5,
    "memoryType": "conversation"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ 메모리 저장 성공 (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    # 응답에서 필수 필드 확인
    if echo "$body" | jq -e '.stored == true' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 메모리 저장 확인${NC}"
    else
        echo -e "${RED}✗ 메모리 저장 확인 실패${NC}"
    fi
else
    echo -e "${RED}✗ 메모리 저장 실패 (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# 컨텍스트 조회 테스트
echo -e "${YELLOW}[4/4] 컨텍스트 조회 API 테스트${NC}"
echo "GET ${SERVER_URL}/api/v1/context?userId=test_user_123&conversationId=test_conv_456&limit=6"
response=$(curl -s -w "\n%{http_code}" -X GET "${SERVER_URL}/api/v1/context?userId=test_user_123&conversationId=test_conv_456&limit=6")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ 컨텍스트 조회 성공 (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    # 응답에서 필수 필드 확인
    if echo "$body" | jq -e '.context' > /dev/null 2>&1 && \
       echo "$body" | jq -e '.contextLength' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 응답 형식 검증 성공${NC}"
    else
        echo -e "${RED}✗ 응답 형식 검증 실패${NC}"
    fi
else
    echo -e "${RED}✗ 컨텍스트 조회 실패 (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

echo "========================================="
echo "테스트 완료"
echo "========================================="

