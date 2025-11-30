/**
 * Chat 관련 타입 정의
 */

import {
  Document,
  DocumentType,
} from '../../document/entity/document.entity';
import { DocumentChunk } from '../../document/entity/document-chunk.entity';

/**
 * 채팅 메시지 인터페이스 (확장)
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: DocumentSource[];
  messageType?: 'text' | 'image';
  images?: string[];
  imageMetadata?: ImageMetadata;
  timestamp?: Date;
}

/**
 * 시스템 메시지를 포함한 LLM 메시지 인터페이스
 */
export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * 문서 소스 인터페이스 (API 응답용)
 */
export interface DocumentSource {
  title: string;
  documentId: string;
  type: DocumentType;
  relevance: number;
  snippet: string;
}

/**
 * 이미지 메타데이터 인터페이스
 */
export interface ImageMetadata {
  prompt: string;
  provider: string;
  model: string;
  size?: string;
  quality?: string;
  style?: string;
  generatedAt?: Date;
}

/**
 * 대화 테마 인터페이스
 */
export interface ConversationTheme {
  // 기본 테마 설정
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;

  // 채팅 버블 스타일
  userBubbleStyle: BubbleStyle;
  aiBubbleStyle: BubbleStyle;

  // 폰트 설정
  fontFamily: string;
  fontSize: string;

  // 배경 이미지/패턴
  backgroundImage?: string;
  backgroundPattern?: string;

  // 애니메이션 효과
  animations: ThemeAnimations;
}

/**
 * 버블 스타일 인터페이스
 */
export interface BubbleStyle {
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
}

/**
 * 테마 애니메이션 인터페이스
 */
export interface ThemeAnimations {
  messageAppear: boolean;
  typingIndicator: boolean;
  bubbleHover: boolean;
}

/**
 * 검색 결과 인터페이스
 * DocumentService.searchDocuments의 반환 타입과 일치
 */
export interface SearchResult {
  document: Document;
  chunk: DocumentChunk;
  score: number;
}

/**
 * 파일 업로드 인터페이스
 */
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
}

/**
 * 대화 완료 요청 인터페이스
 */
export interface ChatCompletionRequest {
  message: string;
  file?: UploadedFile;
  mode?: 'personal' | 'business';
}

/**
 * 대화 완료 응답 인터페이스
 */
export interface ChatCompletionResponse {
  role: 'assistant';
  content: string;
  sources?: DocumentSource[];
  images?: string[];
  imageMetadata?: ImageMetadata;
}

/**
 * 멀티 모델 요청 인터페이스
 */
export interface MultiModelChatRequest {
  message: string;
  providers?: string[];
  imageProviders?: string[];
}

/**
 * 스트리밍 콜백 타입
 */
export type StreamChunkCallback = (chunk: string) => void;
export type SourcesCallback = (sources: DocumentSource[]) => void;
export type ImagesCallback = (images: string[], metadata?: ImageMetadata) => void;

