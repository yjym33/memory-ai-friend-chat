import { NotFoundException } from '@nestjs/common';
import { Conversation } from '../../chat/entity/conversation.entity';
import { ERROR_MESSAGES } from '../constants/llm.constants';

/**
 * 대화 관련 유틸리티 함수
 */

/**
 * 대화 존재 여부 확인 및 반환
 * @param conversation - 대화 객체 또는 null
 * @param conversationId - 대화 ID
 * @throws NotFoundException - 대화가 없는 경우
 * @returns 검증된 대화 객체
 */
export function validateConversationExists(
  conversation: Conversation | null,
  conversationId: number,
): Conversation {
  if (!conversation) {
    throw new NotFoundException(
      `${ERROR_MESSAGES.CONVERSATION_NOT_FOUND} (ID: ${conversationId})`,
    );
  }
  return conversation;
}

/**
 * 대화 메시지 업데이트 (불변성 유지)
 * @param conversation - 기존 대화
 * @param userMessage - 사용자 메시지
 * @param assistantMessage - AI 응답 메시지
 * @param sources - 출처 정보 (선택)
 */
export function createUpdatedMessages(
  conversation: Conversation,
  userMessage: string,
  assistantMessage: string,
  sources?: any[],
): Array<{ role: 'user' | 'assistant'; content: string; sources?: any[] }> {
  return [
    ...conversation.messages,
    { role: 'user' as const, content: userMessage },
    {
      role: 'assistant' as const,
      content: assistantMessage,
      ...(sources && { sources }),
    },
  ];
}

/**
 * 메시지 내용 정리 (공백 제거, 유효성 검사)
 * @param message - 원본 메시지
 * @returns 정리된 메시지
 */
export function sanitizeMessage(message: string): string {
  return message.trim();
}

/**
 * 대화 제목 자동 생성
 * @param firstMessage - 첫 번째 메시지
 * @param maxLength - 최대 길이
 * @returns 생성된 제목
 */
export function generateConversationTitle(
  firstMessage: string,
  maxLength: number = 50,
): string {
  const sanitized = sanitizeMessage(firstMessage);
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  return sanitized.substring(0, maxLength) + '...';
}

/**
 * SSE 이벤트 데이터 포맷팅
 * @param type - 이벤트 타입
 * @param content - 이벤트 내용
 * @returns SSE 포맷 문자열
 */
export function formatSseEvent(type: string, content: any): string {
  return `data: ${JSON.stringify({ type, content })}\n\n`;
}

