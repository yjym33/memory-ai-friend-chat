"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  Heart,
  MessageCircle,
  TrendingUp,
  Star,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import axiosInstance from "../../utils/axios";
import { useRouter } from "next/navigation";
import { AnalyticsData } from "../../types";

export default function OurStoriesPage() {
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "all"
  >("month");

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("📡 Analytics API 호출 시작...");
      const response = await axiosInstance.get(
        `/conversation-analytics?period=${selectedPeriod}`
      );
      console.log("✅ Analytics API 응답:", response.data);

      setAnalyticsData(response.data);

      // 데이터가 비어있는 경우 안내
      if (response.data.totalConversations === 0) {
        setError("아직 대화 기록이 없어요. 루나와 대화를 시작해보세요! 💬");
      }
    } catch (error: unknown) {
      console.error("❌ Analytics API 오류:", error);

      if (
        (error as { response?: { status?: number } }).response?.status === 401
      ) {
        setError("로그인이 필요합니다. 다시 로그인해주세요.");
        router.push("/login");
        return;
      }

      // API 오류 시 더미 데이터로 폴백
      console.log("🔄 더미 데이터로 폴백");
      setAnalyticsData({
        totalConversations: 8,
        relationshipDuration: 5,
        emotionalJourney: "아직 충분한 대화가 없지만, 좋은 시작이에요! 😊",
        milestones: [
          {
            date: new Date().toISOString().split("T")[0],
            type: "first_conversation",
            title: "첫 만남! 🎉",
            description: "루나와의 첫 대화를 나누었습니다.",
            conversationId: 1,
          },
          {
            date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
            type: "personal_share",
            title: "마음을 열었어요 💝",
            description: "개인적인 이야기를 나누며 더 가까워졌습니다.",
            conversationId: 3,
          },
        ],
        emotionTimeline: [
          {
            date: new Date(Date.now() - 4 * 86400000)
              .toISOString()
              .split("T")[0],
            score: 0.2,
          },
          {
            date: new Date(Date.now() - 3 * 86400000)
              .toISOString()
              .split("T")[0],
            score: 0.6,
          },
          {
            date: new Date(Date.now() - 2 * 86400000)
              .toISOString()
              .split("T")[0],
            score: 0.8,
          },
          {
            date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
            score: 0.4,
          },
          { date: new Date().toISOString().split("T")[0], score: 0.9 },
        ],
        favoriteTopics: [
          { topic: "일상", count: 5 },
          { topic: "취미/여가", count: 2 },
          { topic: "감정/고민", count: 1 },
        ],
      });

      setError(
        "실제 데이터를 불러오는 중 문제가 발생했어요. 샘플 데이터를 보여드릴게요."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">우리의 이야기들을 정리하고 있어요...</p>
          <p className="text-sm text-gray-500 mt-2">
            실제 대화 데이터를 분석 중입니다
          </p>
        </div>
      </div>
    );
  }

  const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition"
        >
          <ArrowLeft size={20} />
          돌아가기
        </button>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">{error}</span>
          </div>
        )}

        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            우리가 나눈 이야기들 📖
          </h1>
          <p className="text-gray-600 text-lg">
            루나와 함께한 {analyticsData?.relationshipDuration || 0}일간의
            소중한 순간들
          </p>
          {analyticsData?.totalConversations === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              아직 대화가 없어요. 첫 대화를 시작해보세요! 💬
            </p>
          )}
        </div>

        {/* 기간 선택 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 shadow-lg">
            {(["week", "month", "all"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-2 rounded-full transition ${
                  selectedPeriod === period
                    ? "bg-purple-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {period === "week"
                  ? "최근 1주일"
                  : period === "month"
                  ? "최근 1개월"
                  : "전체"}
              </button>
            ))}
          </div>
        </div>

        {/* 데이터가 있을 때만 통계 표시 */}
        {analyticsData && analyticsData.totalConversations > 0 && (
          <>
            {/* 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
                <MessageCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-800">
                  {analyticsData.totalConversations}
                </div>
                <div className="text-gray-600">총 대화 수</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
                <Calendar className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-800">
                  {analyticsData.relationshipDuration}
                </div>
                <div className="text-gray-600">함께한 날</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-800">
                  {analyticsData.milestones?.length || 0}
                </div>
                <div className="text-gray-600">특별한 순간</div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-800">
                  {analyticsData.relationshipDuration > 0
                    ? `+${Math.round(
                        (analyticsData.totalConversations /
                          analyticsData.relationshipDuration) *
                          100
                      )}%`
                    : "+0%"}
                </div>
                <div className="text-gray-600">활동 지수</div>
              </div>
            </div>

            {/* 감정 여행 요약 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <Heart className="w-6 h-6 text-pink-500 mr-2" />
                감정 여행
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                {analyticsData.emotionalJourney}
              </p>

              {/* 감정 타임라인 차트 */}
              {analyticsData.emotionTimeline &&
                analyticsData.emotionTimeline.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.emotionTimeline}>
                        <defs>
                          <linearGradient
                            id="emotionGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#8B5CF6"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#8B5CF6"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" />
                        <YAxis domain={[-1, 1]} />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#8B5CF6"
                          fillOpacity={1}
                          fill="url(#emotionGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* 마일스톤 타임라인 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Star className="w-6 h-6 text-yellow-500 mr-2" />
                  특별한 순간들
                </h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {analyticsData.milestones &&
                  analyticsData.milestones.length > 0 ? (
                    analyticsData.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {milestone.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {milestone.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {milestone.date}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      아직 특별한 순간이 없어요.
                      <br />
                      더 많은 대화를 나누면서
                      <br />
                      소중한 추억을 만들어보세요! 💝
                    </div>
                  )}
                </div>
              </div>

              {/* 주제별 대화 분포 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  주요 대화 주제
                </h2>
                {analyticsData.favoriteTopics &&
                analyticsData.favoriteTopics.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.favoriteTopics}
                          dataKey="count"
                          nameKey="topic"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ topic, percent }) =>
                            `${topic} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {analyticsData.favoriteTopics.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-16">
                    아직 분석할 대화가 충분하지 않아요.
                    <br />
                    다양한 주제로 대화해보세요! 🗣️
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 대화가 없을 때 안내 */}
        {analyticsData && analyticsData.totalConversations === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center mb-12">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              첫 대화를 시작해보세요!
            </h2>
            <p className="text-gray-600 mb-6">
              루나와 대화를 나누면 여기에 아름다운 이야기들이 기록될 거예요.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition"
            >
              첫 대화 시작하기 🚀
            </button>
          </div>
        )}

        {/* 미래 계획 카드 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">앞으로도 함께해요! 💕</h2>
          <p className="text-purple-100 mb-6">
            {analyticsData && analyticsData.totalConversations > 0
              ? "지금까지 나눈 소중한 이야기들처럼, 앞으로도 더 많은 추억을 만들어가요"
              : "첫 대화부터 시작해서 특별한 추억들을 함께 만들어가요"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
          >
            {analyticsData && analyticsData.totalConversations > 0
              ? "새로운 대화 시작하기"
              : "첫 대화 시작하기"}{" "}
            →
          </button>
        </div>
      </div>
    </div>
  );
}
