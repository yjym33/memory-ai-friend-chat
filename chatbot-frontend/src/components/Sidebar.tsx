/**
 * Sidebar 컴포넌트
 *
 * 대화 목록을 표시하고 관리하는 사이드바 컴포넌트
 *
 * @performance
 * - barrel imports 대신 직접 import 사용 (bundle-barrel-imports)
 * - useMemo로 정렬/필터링 결과 메모이제이션 (rerender-memo)
 * - useCallback으로 이벤트 핸들러 안정화 (rerender-functional-setstate)
 * - toSorted() 사용으로 원본 배열 불변성 유지 (js-tosorted-immutable)
 */
import React, { useState, useMemo, useCallback, memo } from "react";
// 직접 import로 번들 크기 최적화 (barrel file import 피하기)
import { FaPencil } from "react-icons/fa6";
import { FaSearch, FaTrash } from "react-icons/fa";

/** 대화 아이템 타입 정의 */
interface ConversationItem {
  id: number;
  title: string;
  messages: unknown[];
  createdAt: string;
}

/** Sidebar 컴포넌트 Props */
interface SidebarProps {
  /** 대화 목록 */
  conversations: ConversationItem[];
  /** 현재 활성화된 대화 ID */
  activeChatId: number | null;
  /** 활성 대화 변경 핸들러 */
  setActiveChatId: (id: number) => void;
  /** 새 대화 시작 핸들러 */
  startNewChat: () => void;
  /** 대화 삭제 핸들러 */
  onDeleteChat: (id: number) => void;
  /** 대화 제목 수정 핸들러 */
  onUpdateTitle: (id: number, title: string) => void;
}

/**
 * 대화 목록 아이템 컴포넌트
 * memo로 래핑하여 불필요한 리렌더링 방지
 */
const ConversationItemComponent = memo(function ConversationItemComponent({
  chat,
  isActive,
  isEditing,
  editingTitle,
  onEditingTitleChange,
  onTitleSave,
  onSelect,
  onEdit,
  onDelete,
}: {
  chat: ConversationItem;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  onEditingTitleChange: (title: string) => void;
  onTitleSave: (id: number) => void;
  onSelect: (id: number) => void;
  onEdit: (chat: ConversationItem) => void;
  onDelete: (id: number) => void;
}) {
  /**
   * 삭제 버튼 클릭 핸들러
   * 이벤트 전파 중단 후 삭제 함수 호출
   * (확인 다이얼로그는 useChat의 deleteChat 함수 내부에서 처리됨)
   */
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // confirm은 useChat의 deleteChat 함수 내부에서 처리됨
      onDelete(chat.id);
    },
    [chat.id, onDelete]
  );

  /**
   * 편집 버튼 클릭 핸들러
   * 이벤트 전파 중단 후 편집 모드 진입
   */
  const handleEditClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(chat);
    },
    [chat, onEdit]
  );

  return (
    <div
      className={`p-2 rounded-lg cursor-pointer mb-2 flex justify-between items-center ${
        isActive ? "bg-blue-600" : "bg-gray-700"
      }`}
    >
      {isEditing ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => onEditingTitleChange(e.target.value)}
          onBlur={() => onTitleSave(chat.id)}
          onKeyPress={(e) => e.key === "Enter" && onTitleSave(chat.id)}
          className="flex-1 bg-gray-600 text-white px-2 py-1 rounded"
          autoFocus
        />
      ) : (
        <div
          onClick={() => onSelect(chat.id)}
          onDoubleClick={() => onEdit(chat)}
          className="flex-1"
        >
          {chat.title}
        </div>
      )}
      <div className="flex items-center">
        <button
          onClick={handleEditClick}
          className="ml-2 px-2 py-1 bg-blue-500 rounded hover:bg-blue-600 text-sm"
          aria-label="대화 제목 수정"
        >
          <FaPencil />
        </button>
        <button
          onClick={handleDelete}
          className="ml-2 px-2 py-1 bg-red-500 rounded hover:bg-red-600 text-sm"
          aria-label="대화 삭제"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
});

/**
 * 사이드바 메인 컴포넌트
 * 대화 목록의 검색, 정렬, 관리 기능 제공
 */
function Sidebar({
  conversations,
  activeChatId,
  setActiveChatId,
  startNewChat,
  onDeleteChat,
  onUpdateTitle,
}: SidebarProps) {
  // 편집 상태 관리
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // 검색 상태 관리
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * 정렬된 대화 목록
   * toSorted() 사용으로 원본 배열 불변성 유지 (js-tosorted-immutable)
   * useMemo로 메모이제이션하여 불필요한 재계산 방지
   */
  const sortedConversations = useMemo(
    () => conversations.toSorted((a, b) => a.id - b.id),
    [conversations]
  );

  /**
   * 검색 필터링된 대화 목록
   * 검색어가 있을 때만 필터링 수행
   */
  const filteredConversations = useMemo(() => {
    // 조기 반환: 검색어가 없으면 전체 목록 반환 (js-early-exit)
    if (!searchQuery) return sortedConversations;

    const lowerQuery = searchQuery.toLowerCase();
    return sortedConversations.filter((chat) =>
      chat.title.toLowerCase().includes(lowerQuery)
    );
  }, [sortedConversations, searchQuery]);

  /**
   * 대화 제목 편집 시작
   * useCallback으로 안정적인 함수 참조 유지
   */
  const handleTitleEdit = useCallback((chat: ConversationItem) => {
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  }, []);

  /**
   * 대화 제목 저장
   * 빈 제목은 저장하지 않음
   */
  const handleTitleSave = useCallback(
    async (id: number) => {
      if (editingTitle.trim()) {
        await onUpdateTitle(id, editingTitle.trim());
      }
      setEditingId(null);
    },
    [editingTitle, onUpdateTitle]
  );

  /**
   * 검색 모달 닫기
   * 검색어 초기화 포함
   */
  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
  }, []);

  /**
   * 검색 결과에서 대화 선택
   * 선택 후 검색 모달 닫기
   */
  const handleSelectFromSearch = useCallback(
    (id: number) => {
      setActiveChatId(id);
      handleCloseSearch();
    },
    [setActiveChatId, handleCloseSearch]
  );

  /**
   * 검색 모달 열기
   */
  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  return (
    <div className="w-full h-48 sm:h-screen bg-gray-800 text-white p-2 sm:p-4 overflow-y-auto relative">
      {/* 검색 모달 */}
      {isSearchOpen && (
        <div className="absolute inset-0 bg-gray-800 z-10 p-2 sm:p-4">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">채팅방 검색</h3>
              <button
                onClick={handleCloseSearch}
                className="text-gray-300 hover:text-white"
                aria-label="검색 닫기"
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
                  onClick={() => handleSelectFromSearch(chat.id)}
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
          onClick={handleOpenSearch}
          className="p-2 hover:bg-gray-700 rounded-full"
          aria-label="채팅방 검색"
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
          <ConversationItemComponent
            key={chat.id}
            chat={chat}
            isActive={activeChatId === chat.id}
            isEditing={editingId === chat.id}
            editingTitle={editingTitle}
            onEditingTitleChange={setEditingTitle}
            onTitleSave={handleTitleSave}
            onSelect={setActiveChatId}
            onEdit={handleTitleEdit}
            onDelete={onDeleteChat}
          />
        ))}
      </div>
    </div>
  );
}

// memo로 래핑하여 props가 변경되지 않으면 리렌더링 방지
export default memo(Sidebar);
