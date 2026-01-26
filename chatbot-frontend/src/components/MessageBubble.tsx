/**
 * MessageBubble 컴포넌트
 *
 * 채팅 메시지를 버블 형태로 표시하는 컴포넌트
 * 마크다운 렌더링과 TTS(Text-to-Speech) 기능 지원
 *
 * @performance
 * - memo로 컴포넌트 메모이제이션 (rerender-memo)
 * - useCallback으로 이벤트 핸들러 안정화 (rerender-functional-setstate)
 * - useMemo로 마크다운 컴포넌트 옵션 메모이제이션
 * - lucide-react에서 직접 import (bundle-barrel-imports)
 */
import React, { useState, useCallback, useMemo, memo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// 직접 import로 번들 크기 최적화
import { Volume2, VolumeX, Square } from "lucide-react";
import { Message } from "../types";
import { useTTS } from "../hooks/useTTS";

/** MessageBubble 컴포넌트 Props */
interface MessageBubbleProps {
  /** 표시할 메시지 객체 */
  message: Message;
}

/**
 * 코드 언어 추출을 위한 정규식
 * 컴포넌트 외부에 호이스팅하여 재생성 방지 (js-hoist-regexp)
 */
const LANGUAGE_REGEX = /language-(\w+)/;

/**
 * 메시지 버블 컴포넌트
 *
 * 사용자/AI 메시지를 구분하여 다른 스타일로 표시
 * AI 메시지의 경우 TTS 버튼 제공
 */
function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const { speak, stop, isSupported } = useTTS();
  const [isThisMessageSpeaking, setIsThisMessageSpeaking] = useState(false);

  /**
   * TTS 재생/정지 토글 핸들러
   * useCallback으로 함수 참조 안정화
   */
  const handleTTSClick = useCallback(() => {
    if (isThisMessageSpeaking) {
      stop();
      setIsThisMessageSpeaking(false);
    } else {
      setIsThisMessageSpeaking(true);
      speak(message.content, undefined, () => {
        // 재생 완료 콜백: 상태 초기화
        setIsThisMessageSpeaking(false);
      });
    }
  }, [isThisMessageSpeaking, stop, speak, message.content]);

  /**
   * TTS 정지 핸들러
   * 별도의 정지 버튼을 위한 핸들러
   */
  const handleStop = useCallback(() => {
    stop();
    setIsThisMessageSpeaking(false);
  }, [stop]);

  /**
   * ReactMarkdown 컴포넌트 커스터마이징
   * useMemo로 메모이제이션하여 재렌더링 시 재생성 방지
   */
  const markdownComponents = useMemo(
    () => ({
      /**
       * 코드 블록/인라인 코드 렌더러
       * 언어 감지 후 적절한 하이라이터 적용
       */
      code(props: {
        children?: React.ReactNode;
        className?: string;
      }) {
        const { children, className } = props;
        const match = LANGUAGE_REGEX.exec(className || "");
        const language = match ? match[1] : "";
        const isInline = !className;

        // 조건부 렌더링: 명시적 ternary 사용 (rendering-conditional-render)
        return !isInline ? (
          <SyntaxHighlighter language={language} PreTag="div">
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        ) : (
          <code
            className={`${className || ""} ${
              isUser ? "bg-gray-200 text-gray-800" : "bg-blue-600 text-white"
            } rounded px-1 py-0.5 font-mono text-sm`}
          >
            {children}
          </code>
        );
      },
    }),
    [isUser]
  );

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 whitespace-pre-wrap ${
          isUser ? "bg-gray-100 text-gray-800" : "bg-blue-500 text-white"
        }`}
      >
        {/* 메시지 내용 - 마크다운 렌더링 */}
        <ReactMarkdown components={markdownComponents}>
          {message.content}
        </ReactMarkdown>

        {/* TTS 컨트롤 버튼 (AI 메시지에만 표시) */}
        {!isUser && isSupported && (
          <div className="mt-2 flex justify-end items-center gap-2">
            {/* 재생/일시정지 토글 버튼 */}
            <button
              onClick={handleTTSClick}
              className="p-1.5 rounded-full hover:bg-blue-600 transition-colors duration-200
                         focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              title={isThisMessageSpeaking ? "음성 일시정지" : "음성으로 듣기"}
              aria-label={isThisMessageSpeaking ? "음성 일시정지" : "음성으로 듣기"}
            >
              {/* 명시적 조건부 렌더링 (rendering-conditional-render) */}
              {isThisMessageSpeaking ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>

            {/* 정지 버튼 (재생 중일 때만 표시) */}
            {isThisMessageSpeaking && (
              <button
                onClick={handleStop}
                className="p-1.5 rounded-full hover:bg-red-600 transition-colors duration-200
                           focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                title="음성 정지"
                aria-label="음성 정지"
              >
                <Square className="w-4 h-4 text-white fill-current" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// memo로 래핑하여 message prop이 변경되지 않으면 리렌더링 방지
export default memo(MessageBubble);
