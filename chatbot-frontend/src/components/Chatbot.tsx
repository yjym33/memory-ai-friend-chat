"use client";

import { useState } from "react";
import { useChat } from "../hooks/useChat";
import { useTheme } from "../hooks/useTheme";
import ProfileSidebar from "./ProfileSidebar";
import ChatListSidebar from "./ChatListSidebar";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";

export default function Chatbot() {
  const [input, setInput] = useState<string>("");

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
  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const messageToSend = input;
    setInput(""); // 입력 필드 즉시 클리어

    await sendMessage(messageToSend);
  };

  return (
    <div className="flex h-screen w-full">
      {/* 프로필 사이드바 */}
      <ProfileSidebar />

      {/* 채팅 목록 사이드바 */}
      <ChatListSidebar
        conversations={conversations}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        startNewChat={startNewChat}
        onDeleteChat={deleteChat}
        onUpdateTitle={updateChatTitle}
        onTogglePin={toggleChatPin}
      />

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-gray-50">
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
