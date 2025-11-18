import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Volume2, VolumeX, Square } from "lucide-react";
import { Message } from "../types";
import { useTTS } from "../hooks/useTTS";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const { speak, stop, isSpeaking, isSupported } = useTTS();
  const [isThisMessageSpeaking, setIsThisMessageSpeaking] = useState(false);

  /**
   * TTS 버튼 클릭 핸들러
   */
  const handleTTSClick = () => {
    if (isThisMessageSpeaking) {
      stop();
      setIsThisMessageSpeaking(false);
    } else {
      setIsThisMessageSpeaking(true);
      speak(message.content, undefined, () => {
        // 재생 완료 시 상태 초기화
        setIsThisMessageSpeaking(false);
      });
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 whitespace-pre-wrap ${
          isUser ? "bg-gray-100 text-gray-800" : "bg-blue-500 text-white"
        }`}
      >
        {/* 메시지 내용 */}
        <ReactMarkdown
          components={{
            code(props) {
              const { children, className } = props;
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";
              const isInline = !className;

              return !isInline ? (
                <SyntaxHighlighter language={language} PreTag="div">
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code
                  className={`${className} ${
                    isUser
                      ? "bg-gray-200 text-gray-800"
                      : "bg-blue-600 text-white"
                  } rounded px-1 py-0.5 font-mono text-sm`}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>

        {/* TTS 버튼 (AI 메시지에만 표시) */}
        {!isUser && isSupported && (
          <div className="mt-2 flex justify-end items-center gap-2">
            {/* 재생/일시정지 버튼 */}
            <button
              onClick={handleTTSClick}
              className="p-1.5 rounded-full hover:bg-blue-600 transition-colors duration-200 
                         focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              title={isThisMessageSpeaking ? "음성 일시정지" : "음성으로 듣기"}
              aria-label={isThisMessageSpeaking ? "음성 일시정지" : "음성으로 듣기"}
            >
              {isThisMessageSpeaking ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>

            {/* 정지 버튼 (재생 중일 때만 표시) */}
            {isThisMessageSpeaking && (
              <button
                onClick={() => {
                  stop();
                  setIsThisMessageSpeaking(false);
                }}
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
