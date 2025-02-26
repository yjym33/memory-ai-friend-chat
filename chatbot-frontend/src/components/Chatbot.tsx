"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import axiosInstance from '../utils/axios';
import Sidebar from "./Sidebar";
import FileUpload from "./FileUpload";
import MessageBubble from './MessageBubble';
import { useAuthStore } from '../store/authStore'; // useAuth 대신 useAuthStore 사용
import { QUESTION_CATEGORIES, type SuggestedQuestion } from '../data/suggestedQuestions';


interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: number;
  messages: Message[];
  createdAt: string;
}

export default function Chatbot() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<{ originalName: string; path: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryQuestions, setCategoryQuestions] = useState<string[]>([]);
  const { userId, logout } = useAuthStore();

  const [currentFileContext, setCurrentFileContext] = useState<{
    originalName: string;
    path: string;
    content?: string;
  } | null>(null);

  
  const handleCategorySelect = (categoryId: string) => {
    const category = QUESTION_CATEGORIES.find(cat => cat.id === categoryId);
    if (category) {
      // 4개의 랜덤 질문 생성
      const questions = Array.from({ length: 4 }, () => category.questionGenerator());
      setCategoryQuestions(questions);
      setSelectedCategory(categoryId);
    }
  };

  const handleQuestionSelect = async (question: string) => {
    if (!activeChatId) {
      await startNewChat();
    }
    setInput(question);
    await sendMessage();
    setSelectedCategory(null);
  };

  // 초기 로딩 시 대화 목록 가져오기
  useEffect(() => {
    fetchConversations();
  }, []);

  // 대화 목록 가져오기
  const fetchConversations = async () => {
    try {
      const response = await axiosInstance.get('/chat/conversations');
      setConversations(response.data);
      if (response.data.length > 0 && !activeChatId) {
        setActiveChatId(response.data[0].id);
      }
    } catch (error) {
      console.error("대화 목록 가져오기 실패:", error);
    }
  };

  const activeMessages = conversations.find((chat) => chat.id === activeChatId)?.messages || [];

  // 시스템 메시지를 제외한 메시지만 표시
  const visibleMessages = useMemo(() => {
    if (!activeMessages) return [];
    return activeMessages.filter(message => 
      message.role === 'user' || message.role === 'assistant'
    );
  }, [activeMessages]);

  const hasMessages = visibleMessages.length > 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // 새 대화 시작
  const startNewChat = async () => {
    try {
      const response = await axiosInstance.post('/chat/conversations');
      const newChat = response.data;
      setConversations((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    } catch (error) {
      console.error("새 대화 생성 실패:", error);
      alert("새 대화를 시작할 수 없습니다.");
    }
  };

  const handleFileUpload = (fileInfo: { originalName: string; path: string }) => {
    setUploadedFile(fileInfo);
    
    // 파일 업로드 시 사용자에게 보여줄 메시지
    const userMessage: Message = {
      role: "user",
      content: `파일 "${fileInfo.originalName}"에 대해 질문해주세요.`
    };

    setConversations(prev => prev.map(chat =>
      chat.id === activeChatId ? { 
        ...chat, 
        messages: [...chat.messages, userMessage] 
      } : chat
    ));
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!input.trim() || isSendingRef.current || activeChatId === null) return;
    isSendingRef.current = true;
    
    const newMessage: Message = { role: "user", content: input };
    setConversations((prev) => prev.map(chat =>
      chat.id === activeChatId ? { 
        ...chat, 
        messages: [...chat.messages.filter(msg => msg.role !== 'system'), newMessage] 
      } : chat
    ));
    setInput("");
    setLoading(true);
    
    try {
      const requestData = {
        conversationId: activeChatId,
        messages: [...activeMessages, newMessage],
        model: "model",
        uploadedFile: uploadedFile,
        frequency_penalty: 0,
        stop: "<|im_end|>",
        stream: false,
        temperature: 0,
        ignore_eos: false,
        max_tokens: 1000,
        min_tokens: 10,
        skip_special_tokens: false,
        spaces_between_special_tokens: true,
      };

      const response = await axiosInstance.post('/chat/completions', requestData);

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error("응답 데이터에 choices가 없습니다.");
      }

      await fetchConversations();
    } catch (error) {
      console.error("❌ API 요청 실패:", error);
      alert("메시지 전송에 실패했습니다.");
    } finally {
      setLoading(false);
      isSendingRef.current = false;
    }
  };

  // 대화방 삭제
  const handleDeleteChat = async (chatId: number) => {
    try {
      await axiosInstance.delete(`/chat/conversations/${chatId}`);
      
      if (activeChatId === chatId) {
        const remainingChats = conversations.filter(chat => chat.id !== chatId);
        setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
      }
      
      await fetchConversations();
    } catch (error) {
      console.error("대화방 삭제 실패:", error);
      alert("대화방을 삭제하는데 실패했습니다.");
    }
  };

  // 제목 업데이트
  const handleUpdateTitle = async (chatId: number, newTitle: string) => {
    try {
      await axiosInstance.put(`/chat/conversations/${chatId}/title`, {
        title: newTitle,
      });
      await fetchConversations();
    } catch (error) {
      console.error("제목 업데이트 실패:", error);
      alert("제목을 업데이트하는데 실패했습니다.");
    }
  };

  const renderSuggestedQuestions = () => {
    if (selectedCategory) {
      const category = QUESTION_CATEGORIES.find(cat => cat.id === selectedCategory);
      if (!category) return null;

      return (
        <div className="text-center space-y-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-blue-500 hover:text-blue-600 flex items-center"
            >
              <span className="mr-2">←</span> 다른 카테고리 보기
            </button>
            <h2 className="text-xl font-bold text-gray-700">{category.title}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {categoryQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuestionSelect(question)}
                className="p-4 text-left text-black border rounded-lg hover:bg-gray-50 transition-colors "
              >
                {question}
              </button>
            ))}
            <button
              onClick={() => handleCategorySelect(category.id)}
              className="p-2 text-blue-500 hover:text-blue-600"
            >
              다른 질문 보기 🔄
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-700">무엇을 도와드릴까요?</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {QUESTION_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="font-medium font-bold text-black">{category.title}</div>
              <div className="text-sm text-gray-500">{category.description}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen w-full">
      {/* 사이드바 */}
      <div className="w-full sm:w-64 sm:min-w-[16rem] border-b sm:border-b-0 sm:border-r">
        <Sidebar
          conversations={conversations}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          startNewChat={startNewChat}
          onDeleteChat={handleDeleteChat}
          onUpdateTitle={handleUpdateTitle}
        />
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-white h-[calc(100vh-16rem)] sm:h-screen">

        {/* 상단 헤더 */}
        <div className="bg-white shadow p-4 flex justify-between items-center">
          <div className="text-xl text-black font-semibold">
            {activeChatId ? conversations.find(c => c.id === activeChatId)?.title || '새로운 대화' : '새로운 대화'}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{userId}</span>
            <button
              onClick={logout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className={`flex-1 overflow-y-auto p-2 sm:p-4 ${!hasMessages ? 'flex items-center justify-center' : ''}`}>
          {!hasMessages ? renderSuggestedQuestions() : (
            // 기존 메시지 표시 영역
            <div className="max-w-4xl mx-auto w-full flex flex-col">
              {visibleMessages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
              {loading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="animate-pulse flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div className={`border-t p-2 sm:p-4 transition-all duration-300 ${!hasMessages ? 'transform translate-y-0' : ''}`}>
          <div className="max-w-4xl mx-auto w-full space-y-2 sm:space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 p-2 sm:p-3 text-sm text-black sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 whitespace-nowrap text-sm sm:text-base"
              >
                전송
              </button>
            </div>
            <div className="flex items-center justify-center p-2 sm:p-3 bg-gray-50 rounded-lg">
              <FileUpload onFileUploaded={handleFileUpload} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}