-- pgvector 확장 설치
CREATE EXTENSION IF NOT EXISTS vector;

-- 벡터 검색을 위한 인덱스 타입 확인
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- 임베딩 차원 확인 (OpenAI text-embedding-3-small은 1536차원)
-- 나중에 테이블 생성 시 vector(1536) 사용
