import React, { useState, useMemo } from "react";
import { Conversation } from "../types";
import { useSearchDebounce } from "../hooks/useDebounce";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Search, Pin, Archive, Edit2, Trash2, X } from "lucide-react";

interface ChatListSidebarProps {
  conversations: Conversation[];
  activeChatId: number | null;
  setActiveChatId: (id: number) => void;
  startNewChat: () => void;
  onDeleteChat: (chatId: number) => void;
  onUpdateTitle: (chatId: number, newTitle: string) => void;
  onTogglePin: (chatId: number) => void;
  onClose?: () => void;
}

export default function ChatListSidebar({
  conversations,
  activeChatId,
  setActiveChatId,
  startNewChat,
  onDeleteChat,
  onUpdateTitle,
  onTogglePin,
  onClose,
}: ChatListSidebarProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 로컬 스토리지에 사이드바 설정 저장
  const [sidebarSettings, setSidebarSettings] = useLocalStorage(
    "sidebar-settings",
    {
      showPinned: true,
      showArchived: false,
      sortBy: "recent" as "recent" | "alphabetical" | "pinned",
    }
  );

  // 검색 디바운스
  const { debouncedSearchTerm, isSearching } = useSearchDebounce(
    searchTerm,
    300,
    1
  );

  // 대화 목록 필터링 및 정렬
  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations;

    // 검색 필터
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (conv) =>
          conv.title
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          conv.messages?.some((msg) =>
            msg.content
              .toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase())
          )
      );
    }

    // 보관함 필터
    if (!sidebarSettings.showArchived) {
      filtered = filtered.filter((conv) => !conv.isArchived);
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      // 고정된 대화는 항상 위에
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      switch (sidebarSettings.sortBy) {
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "pinned":
          return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        case "recent":
        default:
          return (
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
          );
      }
    });

    return sorted;
  }, [conversations, debouncedSearchTerm, sidebarSettings]);

  const handleTitleEdit = (chat: { id: number; title: string }) => {
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleTitleSave = async (chatId: number) => {
    if (
      editingTitle.trim() &&
      editingTitle !== conversations.find((c) => c.id === chatId)?.title
    ) {
      await onUpdateTitle(chatId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleTitleCancel = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "방금 전";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}일 전`;
    } else {
      return d.toLocaleDateString();
    }
  };

  return (
    <div className="w-80 lg:w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* 모바일 닫기 버튼 */}
      {onClose && (
        <div className="lg:hidden p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">대화 목록</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <button
          onClick={startNewChat}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          새 대화 시작
        </button>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="대화 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* 필터 옵션 */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={() =>
              setSidebarSettings((prev) => ({ ...prev, sortBy: "recent" }))
            }
            className={`px-2 py-1 rounded transition-colors ${
              sidebarSettings.sortBy === "recent"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            최근순
          </button>
          <button
            onClick={() =>
              setSidebarSettings((prev) => ({
                ...prev,
                sortBy: "alphabetical",
              }))
            }
            className={`px-2 py-1 rounded transition-colors ${
              sidebarSettings.sortBy === "alphabetical"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            가나다순
          </button>
          <button
            onClick={() =>
              setSidebarSettings((prev) => ({
                ...prev,
                showArchived: !prev.showArchived,
              }))
            }
            className={`px-2 py-1 rounded transition-colors ${
              sidebarSettings.showArchived
                ? "bg-gray-200 text-gray-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={
              sidebarSettings.showArchived ? "보관함 숨기기" : "보관함 보기"
            }
          >
            <Archive className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {/* 검색 결과 정보 */}
        {debouncedSearchTerm && (
          <div className="p-3 text-sm text-gray-600 bg-blue-50 border-b">
            "{debouncedSearchTerm}" 검색 결과:{" "}
            {filteredAndSortedConversations.length}개
          </div>
        )}

        {filteredAndSortedConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {debouncedSearchTerm ? "검색 결과가 없습니다." : "대화가 없습니다."}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredAndSortedConversations.map((chat) => (
              <div
                key={chat.id}
                className={`group relative rounded-lg transition-all duration-200 ${
                  activeChatId === chat.id
                    ? "bg-blue-100 border-l-4 border-blue-500"
                    : "hover:bg-gray-100"
                } ${chat.pinned ? "ring-1 ring-yellow-300" : ""} ${
                  chat.isArchived ? "opacity-60" : ""
                }`}
              >
                <div
                  onClick={() => setActiveChatId(chat.id)}
                  className="w-full text-left p-3 focus:outline-none cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveChatId(chat.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {chat.pinned && (
                        <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                      )}
                      {chat.isArchived && (
                        <Archive className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                      )}

                      {editingId === chat.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleTitleSave(chat.id);
                              } else if (e.key === "Escape") {
                                handleTitleCancel();
                              }
                            }}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTitleSave(chat.id);
                            }}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            저장
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate text-sm">
                            {chat.title}
                          </h3>
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {chat.messages && chat.messages.length > 0
                              ? chat.messages[chat.messages.length - 1].content
                              : "대화를 시작해보세요!"}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(chat.createdAt)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼들 */}
                    {editingId !== chat.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(chat.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            chat.pinned
                              ? "text-yellow-500 hover:text-yellow-600"
                              : "text-gray-400 hover:text-yellow-500"
                          }`}
                          title={chat.pinned ? "고정 해제" : "고정"}
                        >
                          <Pin className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTitleEdit(chat);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                          title="제목 수정"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("이 대화를 삭제하시겠습니까?")) {
                              onDeleteChat(chat.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="대화 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        전체 {conversations.length}개 대화
        {conversations.filter((c) => c.pinned).length > 0 &&
          ` • 고정 ${conversations.filter((c) => c.pinned).length}개`}
      </div>
    </div>
  );
}
