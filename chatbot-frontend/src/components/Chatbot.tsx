"use client";

import { useState } from "react";
import { useChat } from "../hooks/useChat";
import { useTheme } from "../hooks/useTheme";
import ProfileSidebar from "./ProfileSidebar";
import ChatListSidebar from "./ChatListSidebar";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import { Menu, X } from "lucide-react";

export default function Chatbot() {
  const [input, setInput] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(false);

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
  const handleSendMessage = async (message?: string, file?: any) => {
    const messageToSend = message || input;

    if ((!messageToSend.trim() && !file) || loading) return;

    setInput(""); // 입력 필드 즉시 클리어

    await sendMessage(messageToSend, file);
  };

  // 모바일에서 사이드바 닫기
  const closeSidebars = () => {
    setIsProfileOpen(false);
    setIsChatListOpen(false);
  };

  return (
    <div className="flex h-screen w-full relative">
      {/* 모바일 오버레이 */}
      {(isProfileOpen || isChatListOpen) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebars}
        />
      )}

      {/* 프로필 사이드바 */}
      <div
        className={`
        ${isProfileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        fixed lg:relative z-50 lg:z-auto
        transition-transform duration-300 ease-in-out
        lg:transition-none
      `}
      >
        <ProfileSidebar onClose={() => setIsProfileOpen(false)} />
      </div>

      {/* 채팅 목록 사이드바 */}
      <div
        className={`
        ${isChatListOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        fixed lg:relative z-50 lg:z-auto
        transition-transform duration-300 ease-in-out
        lg:transition-none
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
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {/* 모바일 헤더 */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">루나</h1>
          <button
            onClick={() => setIsChatListOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* 채팅 윈도우 */}
        <ChatWindow
          messages={activeConversation?.messages || []}
          currentTheme={currentTheme}
          onThemeChange={saveTheme}
          conversationId={activeChatId}
        />

        {/* 채팅 입력 */}
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={handleSendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
}
