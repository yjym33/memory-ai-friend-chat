"use client";

import { useState, useEffect } from "react";
import { ChatService } from "../services";
import { Message, Conversation } from "../types";
import { error as toastError } from "../lib/toast";
import ProfileSidebar from "./ProfileSidebar";
import ChatListSidebar from "./ChatListSidebar";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";

export default function Chatbot() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // 대화 목록 가져오기
  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await ChatService.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeChatId) {
        setActiveChatId(data[0].id);
      }
    } catch (error) {
      console.error("대화 목록 가져오기 실패:", error);
    }
  };

  const activeMessages =
    conversations.find((chat) => chat.id === activeChatId)?.messages || [];

  // 메시지 전송
  const sendMessage = async () => {
    if (!input.trim() || loading || activeChatId === null) return;
    setLoading(true);
    const newMessage: Message = { role: "user", content: input };
    setConversations((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
            }
          : chat
      )
    );
    setInput("");
    try {
      // 새로운 서비스를 사용한 메시지 전송
      const assistantMessage = await ChatService.sendMessage(
        activeChatId,
        input
      );

      // 타입이 맞지 않을 경우를 대비한 안전한 변환
      const safeAssistantMessage: Message = {
        role: "assistant",
        content:
          assistantMessage.content ||
          (assistantMessage as { response?: string }).response ||
          (assistantMessage as { data?: { content?: string } }).data?.content ||
          "응답을 받지 못했습니다.",
      };
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [...chat.messages, safeAssistantMessage],
              }
            : chat
        )
      );

      // 대화 목록 갱신
      await fetchConversations();
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      toastError("메시지 전송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 새 대화 시작
  const startNewChat = async () => {
    try {
      const newChat = await ChatService.createConversation();
      setConversations((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    } catch (error) {
      console.error("새 대화 시작 실패:", error);
      toastError("새 대화를 시작할 수 없습니다.");
    }
  };

  // 대화방 삭제 기능
  const handleDeleteChat = async (chatId: number) => {
    if (!window.confirm("이 대화를 삭제하시겠습니까?")) return;
    try {
      await ChatService.deleteConversation(chatId);
      const updated = conversations.filter((chat) => chat.id !== chatId);
      setConversations(updated);
      if (activeChatId === chatId) {
        setActiveChatId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (error) {
      console.error("대화방 삭제 실패:", error);
      toastError("대화방을 삭제하는데 실패했습니다.");
    }
  };

  // 대화방 이름 변경 기능
  const handleUpdateTitle = async (chatId: number, newTitle: string) => {
    try {
      await ChatService.updateConversationTitle(chatId, newTitle);
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );
    } catch (error) {
      console.error("대화방 이름 변경 실패:", error);
      toastError("대화방 이름 변경에 실패했습니다.");
    }
  };

  // 대화방 고정/즐겨찾기 기능
  const handleTogglePin = async (chatId: number) => {
    try {
      const updatedConversation = await ChatService.toggleConversationPin(
        chatId
      );
      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? updatedConversation : c))
      );
    } catch (error) {
      console.error("대화방 고정/해제 실패:", error);
      toastError("대화방 고정/해제에 실패했습니다.");
    }
  };

  return (
    <div className="flex h-screen w-full">
      <ProfileSidebar />
      <ChatListSidebar
        conversations={conversations}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        startNewChat={startNewChat}
        onDeleteChat={handleDeleteChat}
        onUpdateTitle={handleUpdateTitle}
        onTogglePin={handleTogglePin}
      />
      <div className="flex-1 flex flex-col relative">
        <ChatWindow messages={activeMessages} />
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
}
