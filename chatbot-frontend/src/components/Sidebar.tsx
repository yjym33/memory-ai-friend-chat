import React, { useState } from "react";
import { FaPencil } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";

interface SidebarProps {
  conversations: {
    id: number;
    title: string;
    messages: unknown[];
    createdAt: string;
  }[];
  activeChatId: number | null;
  setActiveChatId: (id: number) => void;
  startNewChat: () => void;
  onDeleteChat: (id: number) => void;
  onUpdateTitle: (id: number, title: string) => void;
}

export default function Sidebar({
  conversations,
  activeChatId,
  setActiveChatId,
  startNewChat,
  onDeleteChat,
  onUpdateTitle,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedConversations = [...conversations].sort((a, b) => a.id - b.id); // 채팅방 목록 정렬

  const filteredConversations = sortedConversations.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTitleEdit = (chat: { id: number; title: string }) => {
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleTitleSave = async (id: number) => {
    if (editingTitle.trim()) {
      await onUpdateTitle(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="w-full h-48 sm:h-screen bg-gray-800 text-white p-2 sm:p-4 overflow-y-auto relative">
      {/* 검색 모달 */}
      {isSearchOpen && (
        <div className="absolute inset-0 bg-gray-800 z-10 p-2 sm:p-4">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">채팅방 검색</h3>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }}
                className="text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="채팅방 검색..."
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300">
                <FaSearch />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {searchQuery && (
                <div className="text-sm text-gray-300 mb-2">
                  검색 결과: {filteredConversations.length}개
                </div>
              )}
              {filteredConversations.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg cursor-pointer mb-2"
                >
                  {chat.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 기존 사이드바 내용 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base sm:text-lg font-bold">대화 목록</h2>
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 hover:bg-gray-700 rounded-full"
        >
          <FaSearch />
        </button>
      </div>
      <button
        onClick={startNewChat}
        className="w-full bg-blue-500 py-2 rounded-lg mb-2 sm:mb-4 hover:bg-blue-600 text-sm sm:text-base"
      >
        ➕ 새 대화 시작
      </button>
      <div className="flex-1 overflow-auto">
        {sortedConversations.map((chat) => (
          <div
            key={chat.id}
            className={`p-2 rounded-lg cursor-pointer mb-2 flex justify-between items-center ${
              activeChatId === chat.id ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {editingId === chat.id ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => handleTitleSave(chat.id)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleTitleSave(chat.id)
                }
                className="flex-1 bg-gray-600 text-white px-2 py-1 rounded"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setActiveChatId(chat.id)}
                onDoubleClick={() => handleTitleEdit(chat)}
                className="flex-1"
              >
                {chat.title}
              </div>
            )}
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTitleEdit(chat);
                }}
                className="ml-2 px-2 py-1 bg-blue-500 rounded hover:bg-blue-600 text-sm"
              >
                <FaPencil />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("이 대화를 삭제하시겠습니까?")) {
                    onDeleteChat(chat.id);
                  }
                }}
                className="ml-2 px-2 py-1 bg-red-500 rounded hover:bg-red-600 text-sm"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
