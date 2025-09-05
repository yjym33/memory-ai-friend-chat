import React, { useState, useEffect } from "react";
import {
  AgentService,
  Goal,
  UserGoals,
  GoalRecommendation,
} from "../../services/agentService";
import {
  useAsyncOperation,
  useAsyncAction,
} from "../../hooks/useAsyncOperation";

interface GoalManagerProps {
  onGoalUpdate?: () => void;
}

export default function GoalManager({ onGoalUpdate }: GoalManagerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [statistics, setStatistics] = useState<UserGoals["statistics"] | null>(
    null
  );
  const [recommendations, setRecommendations] = useState<GoalRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"goals" | "recommendations">(
    "goals"
  );

  // 목표 데이터 로드
  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await AgentService.getUserGoals();
      setGoals(response.goals);
      setStatistics(response.statistics);
      setRecommendations(response.recommendations || []);
      setError(null);
    } catch (err) {
      setError("목표를 불러오는데 실패했습니다.");
      console.error("목표 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // 목표 진행률 업데이트
  const updateGoalProgress = async (goalId: number, progress: number) => {
    try {
      await AgentService.updateGoalProgress(goalId, progress);

      // 로컬 상태 업데이트
      setGoals((prevGoals) =>
        prevGoals.map((goal) =>
          goal.id === goalId
            ? { ...goal, progress, lastCheckedAt: new Date() }
            : goal
        )
      );

      // 통계 업데이트
      await loadGoals();

      // 부모 컴포넌트에 알림
      onGoalUpdate?.();
    } catch (err) {
      setError("진행률 업데이트에 실패했습니다.");
      console.error("진행률 업데이트 실패:", err);
    }
  };

  // 목표 삭제
  const deleteGoal = async (goalId: number, goalTitle: string) => {
    if (
      !confirm(
        `"${goalTitle}" 목표를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    try {
      await AgentService.deleteGoal(goalId);

      // 로컬 상태 업데이트
      setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));

      // 통계 업데이트
      await loadGoals();

      // 부모 컴포넌트에 알림
      onGoalUpdate?.();
    } catch (err) {
      setError("목표 삭제에 실패했습니다.");
      console.error("목표 삭제 실패:", err);
    }
  };

  // 추천 목표를 실제 목표로 추가
  const addRecommendedGoal = async (recommendation: GoalRecommendation) => {
    try {
      // 백엔드에 목표 생성 요청
      await AgentService.createGoal({
        title: recommendation.title,
        description: recommendation.description,
        category: recommendation.category,
        priority: recommendation.priority,
      });

      // 전체 목표 목록과 추천 목표를 다시 로드
      // (백엔드에서 중복 제거된 새로운 추천 목표 목록을 가져옴)
      await loadGoals();

      // 부모 컴포넌트에 알림
      onGoalUpdate?.();

      alert(`"${recommendation.title}" 목표가 추가되었습니다!`);
    } catch (err) {
      setError("목표 추가에 실패했습니다.");
      console.error("목표 추가 실패:", err);
    }
  };

  // 카테고리별 색상
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      health: "bg-green-100 text-green-800",
      career: "bg-blue-100 text-blue-800",
      education: "bg-purple-100 text-purple-800",
      relationship: "bg-pink-100 text-pink-800",
      finance: "bg-yellow-100 text-yellow-800",
      hobby: "bg-indigo-100 text-indigo-800",
      personal: "bg-gray-100 text-gray-800",
      travel: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.other;
  };

  // 카테고리 한글명
  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      health: "건강",
      career: "커리어",
      education: "교육",
      relationship: "관계",
      finance: "재정",
      hobby: "취미",
      personal: "개인",
      travel: "여행",
      other: "기타",
    };
    return names[category] || category;
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || colors.active;
  };

  // 상태 한글명
  const getStatusName = (status: string) => {
    const names: Record<string, string> = {
      active: "진행중",
      completed: "완료",
      paused: "일시정지",
      cancelled: "취소",
    };
    return names[status] || status;
  };

  useEffect(() => {
    loadGoals();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 text-center">{error}</div>
        <button
          onClick={loadGoals}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 통계 요약 */}
      {statistics && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">목표 현황</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.total}
              </div>
              <div className="text-sm text-gray-600">전체</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.active}
              </div>
              <div className="text-sm text-gray-600">진행중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.completed}
              </div>
              <div className="text-sm text-gray-600">완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.total > 0
                  ? Math.round((statistics.completed / statistics.total) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600">달성률</div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("goals")}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "goals"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            내 목표들 ({goals.length})
          </button>
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "recommendations"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            추천 목표 ({recommendations.length})
          </button>
        </div>
      </div>

      {/* 목표 목록 탭 */}
      {activeTab === "goals" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">내 목표들</h3>

          {goals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 설정된 목표가 없습니다.
              <br />
              채팅에서 목표를 언급해보세요!
            </div>
          ) : (
            goals.map((goal) => (
              <div
                key={goal.id}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-gray-600 text-sm mt-1">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        goal.category
                      )}`}
                    >
                      {getCategoryName(goal.category)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        goal.status
                      )}`}
                    >
                      {getStatusName(goal.status)}
                    </span>
                    <button
                      onClick={() => deleteGoal(goal.id, goal.title)}
                      className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                      title="목표 삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* 진행률 */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">진행률</span>
                    <span className="text-sm font-medium">
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* 진행률 조절 (활성 목표만) */}
                {goal.status === "active" && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">진행률 조절:</span>
                    <div className="flex gap-2">
                      {[0, 25, 50, 75, 100].map((progress) => (
                        <button
                          key={progress}
                          onClick={() => updateGoalProgress(goal.id, progress)}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                            goal.progress === progress
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {progress}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 목표 정보 */}
                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>우선순위: {goal.priority}</span>
                    <span>
                      생성일: {new Date(goal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {goal.lastCheckedAt && (
                    <div className="mt-1">
                      마지막 업데이트:{" "}
                      {new Date(goal.lastCheckedAt).toLocaleDateString()}
                    </div>
                  )}
                  {goal.completedAt && (
                    <div className="mt-1 text-green-600">
                      완료일: {new Date(goal.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 추천 목표 탭 */}
      {activeTab === "recommendations" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">추천 목표</h3>

          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 추천할 목표가 없습니다.
              <br />
              목표를 더 설정해보세요!
            </div>
          ) : (
            recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition bg-gradient-to-r from-blue-50 to-purple-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">
                      {recommendation.title}
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {recommendation.description}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        recommendation.category
                      )}`}
                    >
                      {getCategoryName(recommendation.category)}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      우선순위 {recommendation.priority}
                    </span>
                    <button
                      onClick={() => addRecommendedGoal(recommendation)}
                      className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition"
                      title="목표로 추가"
                    >
                      추가
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>추천 이유: {recommendation.reason}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
