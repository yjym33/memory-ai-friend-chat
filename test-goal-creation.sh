#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 추천 목표 추가 및 중복 제거 기능 테스트${NC}"
echo "=============================================="

# 1. 로그인
echo -e "\n${YELLOW}1. 로그인 중...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 로그인 실패${NC}"
  echo "응답: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 로그인 성공${NC}"

# 2. 현재 목표 조회
echo -e "\n${YELLOW}2. 현재 목표 조회...${NC}"
GOALS_RESPONSE=$(curl -s -X GET http://localhost:8080/agent/goals \
  -H "Authorization: Bearer $TOKEN")

echo "현재 목표:"
echo "$GOALS_RESPONSE" | jq '.goals[] | {id, title, category, status, progress}' 2>/dev/null || echo "$GOALS_RESPONSE"

# 3. 추천 목표 확인
echo -e "\n${YELLOW}3. 추천 목표 확인...${NC}"
RECOMMENDATIONS=$(echo "$GOALS_RESPONSE" | jq '.recommendations[] | {title, category, priority, reason}' 2>/dev/null)
echo "추천 목표:"
echo "$RECOMMENDATIONS"

# 4. 새로운 목표 생성 (추천 목표를 실제 목표로 추가하는 시뮬레이션)
echo -e "\n${YELLOW}4. 새로운 목표 생성 (추천 목표 추가)...${NC}"
CREATE_RESPONSE=$(curl -s -X POST http://localhost:8080/agent/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "여름 휴가 계획",
    "description": "여름 휴가를 위한 여행 계획을 세워보자",
    "category": "travel",
    "priority": 7
  }')

echo "생성된 목표:"
echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"

# 5. 목표 생성 후 다시 조회하여 추천 목표에서 제거되었는지 확인
echo -e "\n${YELLOW}5. 목표 생성 후 추천 목표 재확인...${NC}"
UPDATED_GOALS_RESPONSE=$(curl -s -X GET http://localhost:8080/agent/goals \
  -H "Authorization: Bearer $TOKEN")

echo "업데이트된 목표 목록:"
echo "$UPDATED_GOALS_RESPONSE" | jq '.goals[] | {id, title, category, status, progress}' 2>/dev/null || echo "$UPDATED_GOALS_RESPONSE"

echo -e "\n${YELLOW}6. 업데이트된 추천 목표 확인 (중복 제거 확인)...${NC}"
UPDATED_RECOMMENDATIONS=$(echo "$UPDATED_GOALS_RESPONSE" | jq '.recommendations[] | {title, category, priority, reason}' 2>/dev/null)
echo "업데이트된 추천 목표:"
echo "$UPDATED_RECOMMENDATIONS"

# 7. 중복 제거 확인
echo -e "\n${YELLOW}7. 중복 제거 확인...${NC}"
CREATED_TITLE="여름 휴가 계획"
RECOMMENDATION_TITLES=$(echo "$UPDATED_RECOMMENDATIONS" | jq -r '.title' 2>/dev/null)

if echo "$RECOMMENDATION_TITLES" | grep -q "$CREATED_TITLE"; then
  echo -e "${RED}❌ 중복 제거 실패: '$CREATED_TITLE'이 추천 목표에 여전히 존재합니다.${NC}"
else
  echo -e "${GREEN}✅ 중복 제거 성공: '$CREATED_TITLE'이 추천 목표에서 제거되었습니다.${NC}"
fi

echo -e "\n${GREEN}✅ 테스트 완료!${NC}"
echo -e "${BLUE}이제 프론트엔드에서 추천 목표의 '추가' 버튼을 클릭하면:${NC}"
echo -e "${BLUE}1. 목표가 실제로 생성됩니다.${NC}"
echo -e "${BLUE}2. 해당 목표가 추천 목표에서 자동으로 제거됩니다.${NC}"
echo -e "${BLUE}3. 중복된 목표는 추천 목표에 나타나지 않습니다.${NC}"
