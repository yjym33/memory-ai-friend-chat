import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { Message } from "../types";
import ThemeSelector from "./theme/ThemeSelector";
import { ChatTheme } from "../types/theme";
import { ChatMode } from "./ChatModeSwitch";
import { FileText, ExternalLink } from "lucide-react";

interface ChatWindowProps {
  messages: Message[];
  currentTheme?: ChatTheme | null;
  onThemeChange?: (theme: ChatTheme) => void;
  conversationId?: number | null;
  chatMode?: ChatMode;
}

export default function ChatWindow({
  messages,
  currentTheme,
  onThemeChange,
  conversationId,
  chatMode = ChatMode.PERSONAL,
}: ChatWindowProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <section className="flex-1 flex flex-col chat-container h-full min-h-0 overflow-y-auto">
      {/* 테마 선택기 헤더 */}
      {currentTheme && onThemeChange && conversationId && (
        <div
          className="sticky top-0 z-10 backdrop-blur-sm border-b p-2 sm:p-4"
          style={{
            backgroundColor: `${currentTheme.colors.surface}CC`,
            borderColor: currentTheme.colors.text.secondary,
          }}
        >
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <h2
              className="text-base sm:text-lg font-semibold"
              style={{ color: currentTheme.colors.text.primary }}
            >
              채팅
            </h2>
            <ThemeSelector
              currentTheme={currentTheme}
              onThemeChange={onThemeChange}
            />
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 sm:gap-6 py-4 sm:py-8 px-2 sm:px-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-800 mt-20">
            대화를 시작해보세요!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-${
                msg.role === "user" ? "end" : "start"
              }`}
            >
              <div
                className={`rounded-2xl shadow p-5 mb-2 max-w-full break-words whitespace-pre-line message-appear ${
                  msg.role === "user" ? "user-message text-right" : "ai-message"
                }`}
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              >
                <div
                  className={`font-bold mb-1 flex items-center gap-2 ${
                    msg.role === "user"
                      ? "justify-end text-pink-700"
                      : "text-purple-700"
                  }`}
                >
                  {msg.role === "user" ? (
                    "나"
                  ) : (
                    <>
                      AI <span className="text-lg">🤔</span>{" "}
                      <span className="text-xs text-gray-700 ml-2">루나</span>
                    </>
                  )}
                </div>
                <div className="text-gray-900 mb-2 whitespace-pre-line break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code({ className, children, ...props }) {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      pre({ className, children, ...props }) {
                        return (
                          <pre className={className} {...props}>
                            {children}
                          </pre>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>

                  {/* 기업 모드 출처 정보 표시 */}
                  {chatMode === ChatMode.BUSINESS &&
                    msg.role === "assistant" &&
                    (msg as any).sources &&
                    (msg as any).sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium mb-2 flex items-center space-x-1 text-gray-600">
                          <FileText className="w-3 h-3" />
                          <span>참고 문서:</span>
                        </p>
                        <div className="space-y-1">
                          {(msg as any).sources.map(
                            (source: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded"
                              >
                                <span className="flex items-center space-x-1">
                                  <ExternalLink className="w-3 h-3" />
                                  <span className="text-gray-700">
                                    {source.title}
                                  </span>
                                </span>
                                <span className="text-blue-600 font-medium">
                                  {(source.relevance * 100).toFixed(0)}%
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
    </section>
  );
}
