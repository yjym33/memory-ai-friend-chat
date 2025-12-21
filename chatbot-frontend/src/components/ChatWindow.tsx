import React, { useEffect, useRef, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { Message } from "../types";
import ThemeSelector from "./theme/ThemeSelector";
import { ChatTheme } from "../types/theme";
import { ChatMode } from "./ChatModeSwitch";
import { FileText, ExternalLink, Volume2, VolumeX, Square, Image as ImageIcon, Download, ZoomIn } from "lucide-react";
import { useTTS } from "../hooks/useTTS";
import SuggestedQuestions from "./suggestion/SuggestedQuestions";

interface ChatWindowProps {
  messages: Message[];
  currentTheme?: ChatTheme | null;
  onThemeChange?: (theme: ChatTheme) => void;
  conversationId?: number | null;
  chatMode?: ChatMode;
  onSendMessage?: (message: string) => void;
}

const ChatWindow = React.memo(function ChatWindow({
  messages,
  currentTheme,
  onThemeChange,
  conversationId,
  chatMode = ChatMode.PERSONAL,
  onSendMessage,
}: ChatWindowProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { speak, stop, isSpeaking, isSupported } = useTTS();
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * TTS 버튼 클릭 핸들러
   */
  const handleTTSClick = (messageContent: string, messageIndex: number) => {
    if (speakingMessageIndex === messageIndex && isSpeaking) {
      stop();
      setSpeakingMessageIndex(null);
    } else {
      setSpeakingMessageIndex(messageIndex);
      speak(messageContent, undefined, () => {
        // 재생 완료 시 상태 초기화
        setSpeakingMessageIndex(null);
      });
    }
  };

  // 스타일 최적화
  const sectionStyle = useMemo(
    () => ({
      background:
        currentTheme?.background?.value ||
        "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
      backgroundColor: currentTheme?.colors?.background || "#f8fafc",
      color: currentTheme?.colors?.text?.primary || "#1f2937",
      height: "100%",
      width: "100%",
    }),
    [currentTheme]
  );

  const headerStyle = useMemo(
    () => ({
      backgroundColor: `${currentTheme?.colors?.surface || "#ffffff"}CC`,
      borderColor: currentTheme?.colors?.text?.secondary || "#9ca3af",
    }),
    [currentTheme]
  );

  return (
    <section
      className="flex-1 flex flex-col chat-container overflow-hidden"
      style={sectionStyle}
    >
      {/* 테마 선택기 헤더 */}
      {currentTheme && onThemeChange && conversationId && (
        <div
          className="sticky top-0 z-10 backdrop-blur-sm border-b p-2 sm:p-4"
          style={headerStyle}
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

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 sm:gap-6 py-4 sm:py-8 px-2 sm:px-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-800 mt-12 p-8">
              <div className="bg-white/80 rounded-2xl shadow-lg backdrop-blur-sm p-8 max-w-xl mx-auto">
                <div className="text-2xl font-semibold mb-2">
                  💬 대화를 시작해보세요!
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  무엇이든 편하게 물어보세요
                </div>

                {/* 동적 추천 질문 컴포넌트 */}
                {onSendMessage && (
                  <SuggestedQuestions onSelectQuestion={onSendMessage} />
                )}
              </div>
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
                    msg.role === "user"
                      ? "user-message text-right bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "ai-message bg-white text-gray-900"
                  }`}
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    backgroundColor:
                      msg.role === "user" ? undefined : "#ffffff",
                    border: msg.role === "user" ? "none" : "1px solid #e5e7eb",
                  }}
                >
                  <div
                    className={`font-bold mb-1 flex items-center gap-2 ${
                      msg.role === "user"
                        ? "justify-end text-white"
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
                  <div
                    className={`mb-2 whitespace-pre-line break-words ${
                      msg.role === "user" ? "text-white" : "text-gray-900"
                    }`}
                  >
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

                    {/* 이미지 표시 */}
                    {msg.images && msg.images.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {/* 이미지 헤더 */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ImageIcon className="w-4 h-4" />
                          <span>생성된 이미지 ({msg.images.length}개)</span>
                        </div>
                        
                        {/* 이미지 그리드 */}
                        <div className={`grid gap-3 ${
                          msg.images.length === 1 
                            ? 'grid-cols-1' 
                            : msg.images.length === 2 
                              ? 'grid-cols-2' 
                              : 'grid-cols-2 lg:grid-cols-3'
                        }`}>
                          {msg.images.map((imageUrl, imgIdx) => (
                            <div 
                              key={imgIdx} 
                              className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                            >
                              <img
                                src={imageUrl}
                                alt={`생성된 이미지 ${imgIdx + 1}`}
                                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                              
                              {/* 이미지 오버레이 (호버 시 표시) */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                                {/* 확대 버튼 */}
                                <button
                                  onClick={() => window.open(imageUrl, '_blank')}
                                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                                  title="이미지 크게 보기"
                                >
                                  <ZoomIn className="w-5 h-5 text-gray-700" />
                                </button>
                                
                                {/* 다운로드 버튼 */}
                                <a
                                  href={imageUrl}
                                  download={`generated-image-${imgIdx + 1}.png`}
                                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                                  title="이미지 다운로드"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="w-5 h-5 text-gray-700" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 이미지 메타데이터 표시 */}
                        {msg.imageMetadata && (
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              모델: {msg.imageMetadata.model}
                            </span>
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              Provider: {msg.imageMetadata.provider}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

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

                    {/* TTS 버튼 (AI 메시지에만 표시) */}
                    {msg.role === "assistant" && isSupported && (
                      <div className="mt-3 flex justify-end items-center gap-2">
                        {/* 재생/일시정지 버튼 */}
                        <button
                          onClick={() => handleTTSClick(msg.content, idx)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 
                                     focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                          title={speakingMessageIndex === idx && isSpeaking ? "음성 일시정지" : "음성으로 듣기"}
                          aria-label={speakingMessageIndex === idx && isSpeaking ? "음성 일시정지" : "음성으로 듣기"}
                        >
                          {speakingMessageIndex === idx && isSpeaking ? (
                            <VolumeX className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Volume2 className="w-5 h-5 text-gray-600 hover:text-purple-600" />
                          )}
                        </button>

                        {/* 정지 버튼 (재생 중일 때만 표시) */}
                        {speakingMessageIndex === idx && isSpeaking && (
                          <button
                            onClick={() => {
                              stop();
                              setSpeakingMessageIndex(null);
                            }}
                            className="p-2 rounded-full hover:bg-red-100 transition-colors duration-200 
                                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                            title="음성 정지"
                            aria-label="음성 정지"
                          >
                            <Square className="w-5 h-5 text-red-600 hover:text-red-700 fill-current" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
    </section>
  );
});

export default ChatWindow;
