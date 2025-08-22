"use client";

import { useState, useEffect } from "react";
import axiosInstance from "../utils/axios";
import ProfileSidebar from "./ProfileSidebar";
import ChatListSidebar from "./ChatListSidebar";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import { Message, Conversation } from "../types";

export default function Chatbot() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // 대화 목록 가져오기
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axiosInstance.get("/chat/conversations");
      setConversations(response.data);
      if (response.data.length > 0 && !activeChatId) {
        setActiveChatId(response.data[0].id);
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
      const requestData = {
        message: input,
      };
      const response = await axiosInstance.post(
        `/chat/completion/${activeChatId}`,
        requestData
      );

      // 백엔드에서 직접 응답을 받는 구조로 수정
      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.content,
      };
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [...chat.messages, assistantMessage],
              }
            : chat
        )
      );

      // 대화 목록 갱신
      await fetchConversations();
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      alert("메시지 전송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 새 대화 시작
  const startNewChat = async () => {
    try {
      const response = await axiosInstance.post("/chat/conversations");
      const newChat = response.data;
      setConversations((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    } catch (error) {
      console.error("새 대화 시작 실패:", error);
      alert("새 대화를 시작할 수 없습니다.");
    }
  };

  // 대화방 삭제 기능
  const handleDeleteChat = async (chatId: number) => {
    if (!window.confirm("이 대화를 삭제하시겠습니까?")) return;
    try {
      await axiosInstance.delete(`/chat/conversations/${chatId}`);
      const updated = conversations.filter((chat) => chat.id !== chatId);
      setConversations(updated);
      if (activeChatId === chatId) {
        setActiveChatId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (error) {
      console.error("대화방 삭제 실패:", error);
      alert("대화방을 삭제하는데 실패했습니다.");
    }
  };

  // 대화방 이름 변경 기능
  const handleUpdateTitle = async (chatId: number, newTitle: string) => {
    try {
      await axiosInstance.put(`/chat/conversations/${chatId}/title`, {
        title: newTitle,
      });
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );
    } catch (error) {
      console.error("대화방 이름 변경 실패:", error);
      alert("대화방 이름 변경에 실패했습니다.");
    }
  };

  // 대화방 고정/즐겨찾기 기능
  const handleTogglePin = async (chatId: number) => {
    try {
      const chat = conversations.find((c) => c.id === chatId);
      if (!chat) return;
      const newPinned = !chat.pinned;
      await axiosInstance.put(`/chat/conversations/${chatId}/pin`, {
        pinned: newPinned,
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, pinned: newPinned } : c))
      );
    } catch (error) {
      console.error("대화방 고정/해제 실패:", error);
      alert("대화방 고정/해제에 실패했습니다.");
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
