import React, { useState } from "react";
import { Conversation } from "../types";

interface ChatListSidebarProps {
  conversations: Conversation[];
  activeChatId: number | null;
  setActiveChatId: (id: number) => void;
  startNewChat: () => void;
  onDeleteChat: (chatId: number) => void;
  onUpdateTitle: (chatId: number, newTitle: string) => void;
  onTogglePin: (chatId: number) => void;
}

export default function ChatListSidebar({
  conversations,
  activeChatId,
  setActiveChatId,
  startNewChat,
  onDeleteChat,
  onUpdateTitle,
  onTogglePin,
}: ChatListSidebarProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleTitleEdit = (chat: { id: number; title: string }) => {
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleTitleSave = (id: number) => {
    if (editingTitle.trim()) {
      onUpdateTitle(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="w-full sm:w-72 bg-white/80 p-4 border-r border-gray-200 min-h-screen flex flex-col">
      <button
        onClick={startNewChat}
        className="w-full py-2 mb-4 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold shadow hover:from-purple-500 hover:to-pink-500 transition"
      >
        + 새 대화 시작
      </button>
      <div className="flex-1 overflow-y-auto">
        <div className="mb-2 text-xs text-gray-400 font-semibold">
          대화 목록
        </div>
        <ul className="space-y-2">
          {conversations
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
            .map((chat) => (
              <li
                key={chat.id}
                className={`rounded-lg px-4 py-3 cursor-pointer shadow-sm border border-gray-100 flex items-center justify-between transition-all ${
                  activeChatId === chat.id
                    ? "bg-purple-50 border-l-4 border-purple-300"
                    : "bg-white"
                }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div
                  onClick={() => setActiveChatId(chat.id)}
                  className="flex-1 min-w-0"
                >
                  {editingId === chat.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleTitleSave(chat.id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleTitleSave(chat.id)
                      }
                      className="w-full border-b border-purple-300 bg-transparent text-sm font-bold focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                  ) : (
                    <div
                      className={`font-bold text-sm mb-1 flex items-center gap-2 ${
                        activeChatId === chat.id
                          ? "text-purple-700"
                          : "text-gray-700"
                      }`}
                      onDoubleClick={() => handleTitleEdit(chat)}
                    >
                      {chat.title || "새로운 대화"}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(chat.id);
                        }}
                        className={`ml-1 text-xs px-1 rounded ${
                          chat.pinned
                            ? "bg-yellow-200 text-yellow-700"
                            : "bg-gray-100 text-gray-400"
                        } hover:bg-yellow-300`}
                        title={chat.pinned ? "고정 해제" : "고정"}
                      >
                        {chat.pinned ? "★" : "☆"}
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 truncate max-w-[160px]">
                    {chat.messages && chat.messages.length > 0
                      ? chat.messages[chat.messages.length - 1].content
                      : "대화를 시작해보세요!"}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {typeof chat.createdAt === "string"
                      ? new Date(chat.createdAt).toLocaleString()
                      : chat.createdAt.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs"
                  title="대화방 삭제"
                >
                  삭제
                </button>
              </li>
            ))}
        </ul>
      </div>
    </aside>
  );
}
