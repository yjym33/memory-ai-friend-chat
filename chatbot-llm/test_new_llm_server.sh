#!/bin/bash

# 새로운 LLM 서버 테스트 스크립트

echo "🧪 새로운 LLM 서버 테스트 시작"
echo "=================================="

# 서버 URL
SERVER_URL="http://localhost:3002"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 테스트 함수
test_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-""}
    local description=$4
    
    echo -e "\n${BLUE}테스트: $description${NC}"
    echo "엔드포인트: $method $endpoint"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$SERVER_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$SERVER_URL$endpoint")
    fi
    
    # 응답과 상태 코드 분리
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ 성공 (HTTP $http_code)${NC}"
        echo "응답: $body" | head -c 200
        [ ${#body} -gt 200 ] && echo "..."
    else
        echo -e "${RED}❌ 실패 (HTTP $http_code)${NC}"
        echo "응답: $body"
    fi
}

# 1. 헬스 체크 테스트
echo -e "\n${YELLOW}1. 헬스 체크 테스트${NC}"
test_endpoint "/" "GET" "" "루트 엔드포인트"
test_endpoint "/health" "GET" "" "헬스 체크"

# 2. 통계 및 메모리 관리 테스트
echo -e "\n${YELLOW}2. 통계 및 메모리 관리 테스트${NC}"
test_endpoint "/api/stats" "GET" "" "서비스 통계 조회"

# 3. 채팅 API 테스트 (기본)
echo -e "\n${YELLOW}3. 기본 채팅 API 테스트${NC}"

basic_chat_data='{
  "messages": [
    {
      "role": "user",
      "content": "안녕하세요! 오늘 날씨가 어때요?"
    }
  ],
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000
}'

test_endpoint "/api/v1/chat/completions" "POST" "$basic_chat_data" "기본 채팅 요청"

# 4. 개인화된 채팅 API 테스트
echo -e "\n${YELLOW}4. 개인화된 채팅 API 테스트${NC}"

personalized_chat_data='{
  "messages": [
    {
      "role": "user",
      "content": "오늘 정말 힘든 일이 있었어. 이야기 들어줄 수 있어?"
    }
  ],
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000,
  "aiSettings": {
    "personalityType": "따뜻함",
    "speechStyle": "반말",
    "emojiUsage": 4,
    "empathyLevel": 5,
    "nickname": "민수"
  },
  "conversation_id": "test_conv_001",
  "user_id": "test_user_001"
}'

test_endpoint "/api/v1/chat/completions" "POST" "$personalized_chat_data" "개인화된 채팅 요청"

# 5. 대화 컨텍스트 테스트
echo -e "\n${YELLOW}5. 대화 컨텍스트 테스트${NC}"

context_chat_data='{
  "messages": [
    {
      "role": "user",
      "content": "내 이름은 김철수야. 프로그래밍을 좋아해."
    },
    {
      "role": "assistant",
      "content": "안녕 철수! 프로그래밍을 좋아한다니 멋져! 어떤 언어를 주로 사용해?"
    },
    {
      "role": "user",
      "content": "Python을 주로 사용해. 그런데 오늘 Python 코드에서 에러가 났어."
    }
  ],
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000,
  "aiSettings": {
    "personalityType": "친근함",
    "speechStyle": "반말",
    "emojiUsage": 3,
    "empathyLevel": 4,
    "nickname": "철수"
  },
  "conversation_id": "test_conv_002",
  "user_id": "test_user_002"
}'

test_endpoint "/api/v1/chat/completions" "POST" "$context_chat_data" "대화 컨텍스트 포함 채팅"

# 6. 메모리 정리 테스트
echo -e "\n${YELLOW}6. 메모리 정리 테스트${NC}"
test_endpoint "/api/cleanup" "POST" "" "메모리 정리"

# 7. 최종 통계 확인
echo -e "\n${YELLOW}7. 최종 통계 확인${NC}"
test_endpoint "/api/stats" "GET" "" "최종 서비스 통계"

echo -e "\n${GREEN}🎉 모든 테스트 완료!${NC}"
echo "=================================="
