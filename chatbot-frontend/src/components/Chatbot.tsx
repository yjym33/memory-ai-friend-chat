"use client";

import { useState } from "react";
import { useChat } from "../hooks/useChat";
import { useTheme } from "../hooks/useTheme";
import ProfileSidebar from "./ProfileSidebar";
import ChatListSidebar from "./ChatListSidebar";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import AiSettingsModal from "./AiSettingsModal";
import AgentStatusModal from "./AgentStatusModal";
import GoalManagerModal from "./goal-management/GoalManagerModal";
import { ChatModeSwitch, ChatMode } from "./ChatModeSwitch";
import { UploadedFile } from "../types";
import { Menu, Settings, FileText } from "lucide-react";

export default function Chatbot() {
  const [input, setInput] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [currentChatMode, setCurrentChatMode] = useState<ChatMode>(
    ChatMode.PERSONAL
  );

  // 모달 상태 관리
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAgentStatusOpen, setIsAgentStatusOpen] = useState(false);
  const [isGoalManagerOpen, setIsGoalManagerOpen] = useState(false);

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
  } = useChat();

  // 테마 관리
  const { currentTheme, saveTheme } = useTheme(activeChatId || 0);

  // 메시지 전송 처리
  const handleSendMessage = async (message?: string, file?: UploadedFile) => {
    const messageToSend = message || input;

    if ((!messageToSend.trim() && !file) || loading) return;

    setInput(""); // 입력 필드 즉시 클리어

    await sendMessage(messageToSend, file, currentChatMode);
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

        {/* 모드 스위치 추가 (데스크톱에서만 표시) */}
        <div className="hidden lg:block bg-white border-b border-gray-200 px-4 py-3">
          <ChatModeSwitch
            onModeChange={setCurrentChatMode}
            disabled={loading}
          />
        </div>

        {/* 채팅 윈도우 */}
        <ChatWindow
          messages={activeConversation?.messages || []}
          currentTheme={currentTheme}
          onThemeChange={saveTheme}
          conversationId={activeChatId}
          chatMode={currentChatMode}
        />

        {/* 채팅 입력 */}
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={handleSendMessage}
          loading={loading}
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
    </div>
  );
}
