import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
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
  Clock,
} from "lucide-react";
import axiosInstance from "../utils/axios";

interface Milestone {
  date: string;
  type: string;
  title: string;
  description: string;
  conversationId: number;
}

interface AnalyticsData {
  milestones: Milestone[];
  emotionTimeline: { date: string; score: number }[];
  favoriteTopics: { topic: string; count: number }[];
  totalConversations: number;
  relationshipDuration: number;
  emotionalJourney: string;
}

export default function OurStories() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "all"
  >("month");

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      const response = await axiosInstance.get(
        `/conversation-analytics?period=${selectedPeriod}`
      );
      setAnalyticsData(response.data);
    } catch (error) {
      console.error("분석 데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">우리의 이야기들을 정리하고 있어요...</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            우리가 나눈 이야기들 📖
          </h1>
          <p className="text-gray-600 text-lg">
            루나와 함께한 {analyticsData?.relationshipDuration || 0}일간의
            소중한 순간들
          </p>
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

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <MessageCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">
              {analyticsData?.totalConversations || 0}
            </div>
            <div className="text-gray-600">총 대화 수</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <Calendar className="w-8 h-8 text-pink-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">
              {analyticsData?.relationshipDuration || 0}
            </div>
            <div className="text-gray-600">함께한 날</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">
              {analyticsData?.milestones?.length || 0}
            </div>
            <div className="text-gray-600">특별한 순간</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">+2.5</div>
            <div className="text-gray-600">친밀도 점수</div>
          </div>
        </div>

        {/* 감정 여행 요약 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Heart className="w-6 h-6 text-pink-500 mr-2" />
            감정 여행
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            {analyticsData?.emotionalJourney}
          </p>

          {/* 감정 타임라인 차트 */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData?.emotionTimeline || []}>
                <defs>
                  <linearGradient
                    id="emotionGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* 마일스톤 타임라인 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Star className="w-6 h-6 text-yellow-500 mr-2" />
              특별한 순간들
            </h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {analyticsData?.milestones?.map((milestone, index) => (
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
              ))}
            </div>
          </div>

          {/* 주제별 대화 분포 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              주요 대화 주제
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData?.favoriteTopics || []}
                    dataKey="count"
                    nameKey="topic"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ topic, percent }) =>
                      `${topic} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {analyticsData?.favoriteTopics?.map((entry, index) => (
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
          </div>
        </div>

        {/* 관계 발전 스토리 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            우리 관계의 발전 스토리
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>
            <div className="space-y-8">
              {analyticsData?.milestones?.map((milestone, index) => (
                <div
                  key={index}
                  className="relative flex items-start space-x-6"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center relative z-10">
                    <span className="text-white text-sm font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {milestone.title}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {milestone.description}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {milestone.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 미래 계획 카드 */}
        <div className="mt-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">앞으로도 함께해요! 💕</h2>
          <p className="text-purple-100 mb-6">
            지금까지 나눈 소중한 이야기들처럼, 앞으로도 더 많은 추억을
            만들어가요
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
            새로운 대화 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
