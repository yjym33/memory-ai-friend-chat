"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, MessageCircle } from "lucide-react";
import {
  SuggestionService,
  SuggestedQuestion,
} from "../../services/suggestionService";

interface SuggestedQuestionsProps {
  onSelectQuestion: (text: string) => void;
}

/**
 * 추천 질문 컴포넌트
 * 사용자의 감정, 목표, 시간대, 계절을 기반으로 동적으로 생성된 추천 질문을 표시합니다.
 */
export default function SuggestedQuestions({
  onSelectQuestion,
}: SuggestedQuestionsProps) {
  const [questions, setQuestions] = useState<SuggestedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * 추천 질문 가져오기
   */
  const fetchSuggestions = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await SuggestionService.getSuggestions();
      setQuestions(response.suggestions);
    } catch (error) {
      console.error("추천 질문 불러오기 실패:", error);
      setQuestions(SuggestionService.getDefaultSuggestions());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  /**
   * 카테고리별 색상 클래스
   */
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "emotion":
        return {
          gradient: "from-pink-50 to-rose-50",
          border: "border-pink-200 hover:border-pink-400",
          hoverBg: "hover:from-pink-100 hover:to-rose-100",
          textColor: "group-hover:text-pink-700",
        };
      case "goal":
        return {
          gradient: "from-blue-50 to-indigo-50",
          border: "border-blue-200 hover:border-blue-400",
          hoverBg: "hover:from-blue-100 hover:to-indigo-100",
          textColor: "group-hover:text-blue-700",
        };
      case "image":
        return {
          gradient: "from-purple-50 to-violet-50",
          border: "border-purple-200 hover:border-purple-400",
          hoverBg: "hover:from-purple-100 hover:to-violet-100",
          textColor: "group-hover:text-purple-700",
        };
      case "seasonal":
        return {
          gradient: "from-green-50 to-emerald-50",
          border: "border-green-200 hover:border-green-400",
          hoverBg: "hover:from-green-100 hover:to-emerald-100",
          textColor: "group-hover:text-green-700",
        };
      default:
        return {
          gradient: "from-gray-50 to-slate-50",
          border: "border-gray-200 hover:border-gray-400",
          hoverBg: "hover:from-gray-100 hover:to-slate-100",
          textColor: "group-hover:text-gray-700",
        };
    }
  };

  /**
   * 로딩 상태 UI
   */
  if (loading) {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-purple-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">추천 질문을 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span>이런 질문은 어떨까요?</span>
        </div>
        <button
          onClick={() => fetchSuggestions(true)}
          disabled={isRefreshing}
          className={`p-1.5 rounded-full transition-colors ${
            isRefreshing
              ? "bg-gray-100 cursor-not-allowed"
              : "hover:bg-gray-100"
          }`}
          title="새로고침"
        >
          <RefreshCw
            className={`w-4 h-4 text-gray-400 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* 추천 질문 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {questions.map((question) => {
          const style = getCategoryStyle(question.category);

          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(question.text)}
              className={`group flex items-start gap-3 p-4 
                         bg-gradient-to-br ${style.gradient} ${style.hoverBg}
                         border ${style.border}
                         rounded-xl shadow-sm hover:shadow-md 
                         transition-all duration-200 text-left
                         transform hover:-translate-y-0.5`}
            >
              {/* 이모지 */}
              <span className="text-2xl group-hover:scale-110 transition-transform flex-shrink-0 mt-0.5">
                {question.emoji}
              </span>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium text-gray-700 ${style.textColor} transition-colors`}
                >
                  {question.text}
                </div>
                {question.reason && (
                  <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                    {question.reason}
                  </div>
                )}
              </div>

              {/* 호버 시 화살표 아이콘 */}
              <MessageCircle className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5" />
            </button>
          );
        })}
      </div>

      {/* 빈 상태 */}
      {questions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">추천 질문을 불러올 수 없습니다</p>
          <button
            onClick={() => fetchSuggestions(true)}
            className="text-purple-500 hover:text-purple-600 text-sm mt-2"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
