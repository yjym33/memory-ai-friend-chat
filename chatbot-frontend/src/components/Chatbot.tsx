"use client";

import { useState, useEffect, useCallback } from "react";
import { useChat } from "../hooks/useChat";
import { useTheme } from "../hooks/useTheme";
import { useAuthStore } from "../store/authStore";
import ProfileSidebar from "./ProfileSidebar";
import ChatListSidebar from "./ChatListSidebar";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import AiSettingsModal from "./AiSettingsModal";
import AgentStatusModal from "./AgentStatusModal";
import GoalManagerModal from "./goal-management/GoalManagerModal";
import TTSControlBar from "./TTSControlBar";
import { ChatMode } from "./ChatModeSwitch";
import {
  MultiModelResponseSelector,
  MultiModelProviderSelector,
  MultiModelModeToggle,
  MultiImageSelector,
  MultiImageProviderSelector,
} from "./multi-model";
import {
  UploadedFile,
  Message,
  AiSettings,
  LLMProvider,
  ImageProvider,
  ProviderInfo,
  ProviderResponse,
  ImageProviderInfo,
  ProviderImageResponse,
} from "../types";
import { Menu, FileText, BookOpen } from "lucide-react";
import { getModelDisplayName, getImageModelDisplayName } from "../utils/modelNames";
import { AiSettingsService, multiModelService, multiImageService } from "../services";

export default function Chatbot() {
  const [input, setInput] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [currentChatMode, setCurrentChatMode] = useState<ChatMode>(
    ChatMode.PERSONAL
  );
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);

  // 모달 상태 관리
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAgentStatusOpen, setIsAgentStatusOpen] = useState(false);
  const [isGoalManagerOpen, setIsGoalManagerOpen] = useState(false);

  // Multi-Model 모드 상태 (텍스트)
  const [isMultiModelMode, setIsMultiModelMode] = useState(false);
  const [showMultiModelSelector, setShowMultiModelSelector] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<LLMProvider[]>([]);
  const [multiModelResponses, setMultiModelResponses] = useState<ProviderResponse[]>([]);
  const [multiModelLoading, setMultiModelLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>("");

  // Multi-Image 모드 상태 (이미지)
  const [showMultiImageSelector, setShowMultiImageSelector] = useState(false);
  const [availableImageProviders, setAvailableImageProviders] = useState<ImageProviderInfo[]>([]);
  const [selectedImageProviders, setSelectedImageProviders] = useState<ImageProvider[]>([]);
  const [multiImageResponses, setMultiImageResponses] = useState<ProviderImageResponse[]>([]);
  const [pendingImagePrompt, setPendingImagePrompt] = useState<string>("");

  // 모바일 환경에서만 사이드바 상태 관리
  // 웹 환경에서는 별도의 컴포넌트로 항상 표시

  const {
    conversations,
    activeConversation,
    activeChatId,
    loading,
    setActiveChatId,
    sendMessage,
    startNewChat,
    deleteChat,
    updateChatTitle,
    toggleChatPin,
    toggleChatArchive,
  } = useChat();

  // 테마 관리
  const { currentTheme, saveTheme } = useTheme(activeChatId || 0);

  // 사용자 유형에 따른 자동 모드 설정
  const { userType } = useAuthStore();

  // AI 설정 상태 (모델 정보 표시용)
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);

  // 현재 사용 중인 LLM 모델 이름
  const currentModelName = aiSettings?.llmModel
    ? getModelDisplayName(aiSettings.llmModel)
    : "GPT-5.1";

  // 현재 사용 중인 이미지 생성 모델 이름
  const currentImageModelName = aiSettings?.imageModel
    ? getImageModelDisplayName(aiSettings.imageModel)
    : "DALL-E 3";

  // AI 설정 가져오기 (컴포넌트 마운트 시 및 설정 변경 시)
  useEffect(() => {
    const fetchAiSettings = async () => {
      try {
        const settings = await AiSettingsService.getSettings();
        setAiSettings(settings);
      } catch (error) {
        console.error("AI 설정 불러오기 실패:", error);
        // 에러 발생 시 기본값 사용
        setAiSettings(null);
      }
    };

    fetchAiSettings();
  }, [isSettingsOpen]); // 설정 모달이 열렸다가 닫힐 때 다시 가져오기

  useEffect(() => {
    const autoMode =
      userType === "business" ? ChatMode.BUSINESS : ChatMode.PERSONAL;
    setCurrentChatMode(autoMode);
  }, [userType]);

  // Multi-Model: 사용 가능한 LLM Provider 목록 가져오기
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await multiModelService.getAvailableProviders();
        setAvailableProviders(response.providers);
        // 기본적으로 사용 가능한 모든 Provider 선택
        setSelectedProviders(response.available);
      } catch (error) {
        console.error("LLM Provider 목록 불러오기 실패:", error);
      }
    };

    if (isMultiModelMode) {
      fetchProviders();
    }
  }, [isMultiModelMode]);

  // Multi-Image: 사용 가능한 이미지 Provider 목록 가져오기
  useEffect(() => {
    const fetchImageProviders = async () => {
      try {
        const response = await multiImageService.getAvailableProviders();
        setAvailableImageProviders(response.providers);
        // 기본적으로 사용 가능한 모든 이미지 Provider 선택
        setSelectedImageProviders(response.available);
      } catch (error) {
        console.error("이미지 Provider 목록 불러오기 실패:", error);
      }
    };

    if (isMultiModelMode) {
      fetchImageProviders();
    }
  }, [isMultiModelMode]);

  // Multi-Model 응답 생성 (텍스트 + 이미지)
  const generateMultiModelResponses = useCallback(
    async (message: string) => {
      if (!activeChatId || selectedProviders.length === 0) return;

      setMultiModelLoading(true);
      setPendingMessage(message);

      try {
        // 이미지 Provider도 함께 전송
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/completion/${activeChatId}/multi`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              message,
              providers: selectedProviders,
              imageProviders: selectedImageProviders,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          // 이미지 생성 응답인 경우 (Multi-Image)
          if (data.isImageGeneration && data.isMultiImage) {
            console.log("🎨 Multi-Image 생성 완료:", data.multiImageResponses);
            setPendingImagePrompt(data.prompt);
            setMultiImageResponses(data.multiImageResponses);
            setShowMultiImageSelector(true);
            setMultiModelLoading(false);
            return;
          }

          // 단일 이미지 생성 응답인 경우 (fallback)
          if (data.isImageGeneration) {
            console.log("🎨 이미지 생성 완료:", data.images);
            setMultiModelLoading(false);
            setPendingMessage("");
            window.location.reload();
            return;
          }

          // 일반 Multi-Model 텍스트 응답
          setMultiModelResponses(data.responses);
          setShowMultiModelSelector(true);
        } else {
          console.error("Multi-Model 응답 생성 실패:", data.error);
        }
      } catch (error) {
        console.error("Multi-Model 요청 실패:", error);
      } finally {
        setMultiModelLoading(false);
      }
    },
    [activeChatId, selectedProviders, selectedImageProviders]
  );

  // Multi-Model: 응답 선택 처리
  const handleMultiModelSelect = useCallback(
    async (response: ProviderResponse) => {
      if (!activeChatId) return;

      try {
        await multiModelService.selectResponse(activeChatId, {
          userMessage: pendingMessage,
          selectedProvider: response.provider,
          selectedModel: response.model,
          selectedContent: response.content,
          allResponses: multiModelResponses.map((r) => ({
            provider: r.provider,
            model: r.model,
            content: r.content,
            latency: r.latency,
          })),
        });

        // 채팅 목록 새로고침을 위해 페이지 리프레시 대신 상태 업데이트
        setShowMultiModelSelector(false);
        setMultiModelResponses([]);
        setPendingMessage("");
        
        // 대화 새로고침
        window.location.reload();
      } catch (error) {
        console.error("응답 저장 실패:", error);
      }
    },
    [activeChatId, pendingMessage, multiModelResponses]
  );

  // Multi-Model: 취소 처리
  const handleMultiModelCancel = useCallback(() => {
    setShowMultiModelSelector(false);
    setMultiModelResponses([]);
    setPendingMessage("");
  }, []);

  // Multi-Image: 이미지 선택 처리
  const handleMultiImageSelect = useCallback(
    async (response: ProviderImageResponse, imageUrl: string) => {
      if (!activeChatId) return;

      try {
        // 선택된 이미지를 대화에 저장
        const saveResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/completion/${activeChatId}/multi/select`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              userMessage: `이미지 생성: ${pendingImagePrompt}`,
              selectedProvider: response.provider,
              selectedModel: response.model,
              selectedContent: `🎨 선택한 이미지 (${response.provider} - ${response.model})`,
              allResponses: multiImageResponses.map((r) => ({
                provider: r.provider,
                model: r.model,
                content: r.images[0]?.url || "",
                latency: r.latency,
              })),
            }),
          }
        );

        if (saveResponse.ok) {
          setShowMultiImageSelector(false);
          setMultiImageResponses([]);
          setPendingMessage("");
          setPendingImagePrompt("");
          window.location.reload();
        }
      } catch (error) {
        console.error("이미지 저장 실패:", error);
      }
    },
    [activeChatId, pendingImagePrompt, multiImageResponses]
  );

  // Multi-Image: 취소 처리
  const handleMultiImageCancel = useCallback(() => {
    setShowMultiImageSelector(false);
    setMultiImageResponses([]);
    setPendingImagePrompt("");
  }, []);

  // 최신 AI 응답의 참고 문서 수집 (기업 모드용)
  const latestAssistantWithSources = [...(activeConversation?.messages || [])]
    .reverse()
    .find((m) => m.role === "assistant" && m.sources?.length);
  const currentSources: NonNullable<Message["sources"]> =
    latestAssistantWithSources?.sources || [];

  // 메시지 전송 처리
  const handleSendMessage = async (message?: string, file?: UploadedFile) => {
    const messageToSend = message || input;

    if ((!messageToSend.trim() && !file) || loading || multiModelLoading) return;

    setInput(""); // 입력 필드 즉시 클리어

    // Multi-Model 모드인 경우
    if (isMultiModelMode && selectedProviders.length >= 2) {
      await generateMultiModelResponses(messageToSend);
    } else {
      // 일반 모드
      await sendMessage(messageToSend, file, currentChatMode);
    }
  };

  // 모바일에서 사이드바 닫기
  const closeSidebars = () => {
    setIsProfileOpen(false);
    setIsChatListOpen(false);
  };

  return (
    <div className="flex h-screen w-full relative bg-gray-50 overflow-hidden">
      {/* 모바일 오버레이 - 모바일에서만 표시 */}
      {(isProfileOpen || isChatListOpen) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebars}
        />
      )}

      {/* 프로필 사이드바 - 웹과 모바일 완전 분리 */}
      {/* 웹 환경: 항상 표시 */}
      <div className="hidden lg:block lg:relative">
        <ProfileSidebar
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAgentStatus={() => setIsAgentStatusOpen(true)}
          onOpenGoalManager={() => setIsGoalManagerOpen(true)}
        />
      </div>

      {/* 모바일 환경: 슬라이드 방식 */}
      <div
        className={`
        ${isProfileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:hidden
        fixed z-50
        transition-transform duration-300 ease-in-out
      `}
      >
        <ProfileSidebar
          onClose={() => setIsProfileOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAgentStatus={() => setIsAgentStatusOpen(true)}
          onOpenGoalManager={() => setIsGoalManagerOpen(true)}
        />
      </div>

      {/* 채팅 목록 사이드바 - 웹과 모바일 완전 분리 */}
      {/* 웹 환경: 항상 표시 */}
      <div className="hidden lg:block lg:relative">
        <ChatListSidebar
          conversations={conversations}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          startNewChat={startNewChat}
          onDeleteChat={deleteChat}
          onUpdateTitle={updateChatTitle}
          onTogglePin={toggleChatPin}
          onToggleArchive={toggleChatArchive}
        />
      </div>

      {/* 모바일 환경: 슬라이드 방식 */}
      <div
        className={`
        ${isChatListOpen ? "translate-x-0" : "-translate-x-full"}
        lg:hidden
        fixed z-50
        transition-transform duration-300 ease-in-out
      `}
      >
        <ChatListSidebar
          conversations={conversations}
          activeChatId={activeChatId}
          setActiveChatId={(id) => {
            setActiveChatId(id);
            closeSidebars(); // 모바일에서 채팅 선택 시 사이드바 닫기
          }}
          startNewChat={() => {
            startNewChat();
            closeSidebars(); // 모바일에서 새 채팅 시작 시 사이드바 닫기
          }}
          onDeleteChat={deleteChat}
          onUpdateTitle={updateChatTitle}
          onTogglePin={toggleChatPin}
          onToggleArchive={toggleChatArchive}
          onClose={() => setIsChatListOpen(false)}
        />
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0 h-full overflow-hidden">
        {/* 모바일 헤더 */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">루나</h1>
          <div className="flex items-center space-x-2">
            {/* 기업 모드일 때 문서 관리 버튼 표시 */}
            {currentChatMode === ChatMode.BUSINESS && (
              <button
                onClick={() => window.open("/admin?tab=documents", "_blank")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="문서 관리"
              >
                <FileText className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setIsChatListOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 모드 표시 및 참고 문서 버튼 (데스크톱에서만 표시) */}
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">현재 모드:</span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                currentChatMode === ChatMode.BUSINESS
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {currentChatMode === ChatMode.BUSINESS
                ? "🏢 기업 쿼리"
                : "💬 AI 친구"}
            </span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-600">LLM:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              🤖 {currentModelName}
            </span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-600">이미지:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-700">
              🎨 {currentImageModelName}
            </span>
            <span className="text-sm text-gray-400">|</span>
            {/* Multi-Model 모드 토글 */}
            <MultiModelModeToggle
              isEnabled={isMultiModelMode}
              onToggle={setIsMultiModelMode}
              disabled={loading || multiModelLoading}
            />
          </div>

          {/* 기업 모드에서만 참고 문서 버튼 표시 */}
          {currentChatMode === ChatMode.BUSINESS && (
            <button
              onClick={() => setShowSourcesPanel(!showSourcesPanel)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${
                showSourcesPanel
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              } ${
                currentSources.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={currentSources.length === 0}
              title={
                currentSources.length === 0
                  ? "참고할 문서가 없습니다"
                  : "참고 문서 보기"
              }
            >
              <BookOpen className="w-4 h-4" />
              참고 문서
              {currentSources.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {currentSources.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Multi-Model Provider 선택 (Multi-Model 모드일 때만 표시) */}
        {isMultiModelMode && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200 px-4 py-3 space-y-3">
            {/* 텍스트 LLM Provider 선택 */}
            <MultiModelProviderSelector
              providers={availableProviders}
              selectedProviders={selectedProviders}
              onSelectionChange={setSelectedProviders}
              minSelection={2}
              maxSelection={3}
            />
            {/* 이미지 Provider 선택 */}
            <div className="border-t border-purple-200 pt-3">
              <MultiImageProviderSelector
                providers={availableImageProviders}
                selectedProviders={selectedImageProviders}
                onSelectionChange={setSelectedImageProviders}
                minSelection={1}
                maxSelection={3}
              />
            </div>
          </div>
        )}

        {/* 메인 채팅 영역 + 참고 문서 패널 */}
        <div className="flex-1 flex min-h-0">
          {/* Multi-Model 응답 선택 UI (텍스트) */}
          {showMultiModelSelector && (
            <div className="absolute inset-0 z-50 bg-white overflow-auto">
              <MultiModelResponseSelector
                responses={multiModelResponses}
                userMessage={pendingMessage}
                onSelect={handleMultiModelSelect}
                onCancel={handleMultiModelCancel}
                isLoading={multiModelLoading}
              />
            </div>
          )}

          {/* Multi-Image 선택 UI (이미지) */}
          {showMultiImageSelector && (
            <div className="absolute inset-0 z-50 bg-white overflow-auto">
              <MultiImageSelector
                responses={multiImageResponses}
                prompt={pendingImagePrompt}
                onSelect={handleMultiImageSelect}
                onCancel={handleMultiImageCancel}
                isLoading={multiModelLoading}
              />
            </div>
          )}

          {/* 채팅 윈도우 */}
          <div className="flex-1 min-w-0">
            <ChatWindow
              messages={activeConversation?.messages || []}
              currentTheme={currentTheme}
              onThemeChange={saveTheme}
              conversationId={activeChatId}
              chatMode={currentChatMode}
            />
          </div>

          {/* 참고 문서 패널 (기업 모드에서만 표시) */}
          {currentChatMode === ChatMode.BUSINESS && showSourcesPanel && (
            <aside className="hidden lg:flex w-80 shrink-0 flex-col border-l border-gray-200 bg-white">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <BookOpen className="w-4 h-4" />
                  참고 문서
                </div>
                <button
                  onClick={() => setShowSourcesPanel(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                >
                  닫기
                </button>
              </div>
              <div className="flex-1 p-3 overflow-auto">
                {currentSources.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      아직 참고할 문서가 없습니다
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      기업 모드에서 질문하면 관련 문서가 표시됩니다
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentSources.map((source, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {source.title}
                          </h4>
                          <div className="ml-2 flex-shrink-0">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {(source.relevance * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {source.snippet && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                            {source.snippet}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          {source.type && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white border text-gray-500">
                              {source.type}
                            </span>
                          )}
                          <button
                            onClick={() =>
                              window.open("/admin?tab=documents", "_blank")
                            }
                            className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            문서 관리에서 보기 →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>

        {/* 채팅 입력 */}
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={handleSendMessage}
          loading={loading || multiModelLoading}
          chatMode={currentChatMode}
        />
      </div>

      {/* 모달들 - 독립적으로 렌더링 */}
      <AiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <AgentStatusModal
        isOpen={isAgentStatusOpen}
        onClose={() => setIsAgentStatusOpen(false)}
      />
      <GoalManagerModal
        isOpen={isGoalManagerOpen}
        onClose={() => setIsGoalManagerOpen(false)}
      />

      {/* TTS 컨트롤 바 */}
      <TTSControlBar />
    </div>
  );
}
