import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import axiosInstance from "../utils/axios";
import MemoryTestSection from "./MemoryTestSection";

interface AiSettingsData {
  personalityType: string;
  speechStyle: string;
  emojiUsage: number;
  nickname: string;
  empathyLevel: number;
  memoryRetentionDays: number;
  memoryPriorities: {
    personal: number;
    hobby: number;
    work: number;
    emotion: number;
  };
  userProfile: {
    interests: string[];
    currentGoals: string[];
    importantDates: { name: string; date: string }[];
  };
  avoidTopics: string[];
}

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiSettingsModal({
  isOpen,
  onClose,
}: AiSettingsModalProps) {
  const [settings, setSettings] = useState<AiSettingsData>({
    personalityType: "친근함",
    speechStyle: "반말",
    emojiUsage: 3,
    nickname: "",
    empathyLevel: 3,
    memoryRetentionDays: 90,
    memoryPriorities: { personal: 5, hobby: 4, work: 3, emotion: 5 },
    userProfile: { interests: [], currentGoals: [], importantDates: [] },
    avoidTopics: [],
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"personality" | "memory">(
    "personality"
  );

  const [testResponse, setTestResponse] = useState("");
  const [selectedTestMessage, setSelectedTestMessage] = useState("");

  const [beforeResponse, setBeforeResponse] = useState("");
  const [afterResponse, setAfterResponse] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const response = await axiosInstance.get("/ai-settings");
      setSettings(response.data);
    } catch (error) {
      console.error("설정 불러오기 실패:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axiosInstance.put("/ai-settings", settings);
      alert("설정이 저장되었습니다!");
      onClose();
    } catch (error) {
      alert("설정 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const testSettings = async () => {
    setLoading(true);
    try {
      // 임시로 설정을 저장
      await axiosInstance.put("/ai-settings", settings);

      // 테스트 메시지 전송
      const testMessage = "안녕! 기분이 어떤지 궁금해~";
      const response = await axiosInstance.post("/chat/completions", {
        messages: [{ role: "user", content: testMessage }],
      });

      setTestResponse(response.data.choices[0].message.content);
    } catch (error) {
      setTestResponse("테스트 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const compareSettings = async () => {
    const testMessage = "안녕! 오늘 하루 어땠어?";

    try {
      // 현재 설정으로 테스트
      const currentResponse = await axiosInstance.post("/chat/completions", {
        messages: [{ role: "user", content: testMessage }],
      });
      setBeforeResponse(currentResponse.data.choices[0].message.content);

      // 새 설정 적용
      await axiosInstance.put("/ai-settings", settings);

      // 새 설정으로 테스트
      const newResponse = await axiosInstance.post("/chat/completions", {
        messages: [{ role: "user", content: testMessage }],
      });
      setAfterResponse(newResponse.data.choices[0].message.content);
    } catch (error) {
      console.error("비교 테스트 실패:", error);
    }
  };

  const addInterest = () => {
    const interest = prompt("관심사를 입력하세요:");
    if (interest) {
      setSettings((prev) => ({
        ...prev,
        userProfile: {
          ...prev.userProfile,
          interests: [...prev.userProfile.interests, interest],
        },
      }));
    }
  };

  const removeInterest = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        interests: prev.userProfile.interests.filter((_, i) => i !== index),
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">AI 친구 설정</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* 탭 버튼 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("personality")}
            className={`flex-1 py-3 px-4 text-center transition ${
              activeTab === "personality"
                ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            🎭 성격 설정
          </button>
          <button
            onClick={() => setActiveTab("memory")}
            className={`flex-1 py-3 px-4 text-center transition ${
              activeTab === "memory"
                ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            🧠 기억 관리
          </button>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === "personality" && (
            <>
              {/* 성격 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  성격 유형
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["친근함", "차분함", "활발함", "따뜻함"].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          personalityType: type,
                        }))
                      }
                      className={`p-3 rounded-lg border transition ${
                        settings.personalityType === type
                          ? "bg-purple-100 border-purple-500 text-purple-700"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 말투 스타일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  말투 스타일
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["격식체", "반말"].map((style) => (
                    <button
                      key={style}
                      onClick={() =>
                        setSettings((prev) => ({ ...prev, speechStyle: style }))
                      }
                      className={`p-3 rounded-lg border transition ${
                        settings.speechStyle === style
                          ? "bg-purple-100 border-purple-500 text-purple-700"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* 별명 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI가 나를 부르는 별명 (선택사항)
                </label>
                <input
                  type="text"
                  value={settings.nickname}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      nickname: e.target.value,
                    }))
                  }
                  placeholder="예: 친구, 동료, 이름 등"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* 이모티콘 사용량 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이모티콘 사용량: {settings.emojiUsage}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={settings.emojiUsage}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      emojiUsage: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>적게</span>
                  <span>많이</span>
                </div>
              </div>

              {/* 공감 수준 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  공감 표현 수준: {settings.empathyLevel}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={settings.empathyLevel}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      empathyLevel: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>차분한 공감</span>
                  <span>적극적 공감</span>
                </div>
              </div>

              {/* 성격 설정 테스트 섹션 - 성격 탭에서만 표시 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  🎭 성격 설정 테스트
                </h3>

                {/* 테스트 메시지 드롭다운 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    테스트 메시지 선택
                  </label>
                  <select
                    value={selectedTestMessage}
                    onChange={(e) => setSelectedTestMessage(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">테스트 메시지를 선택하세요</option>
                    <option value="오늘 기분이 좀 안 좋아...">
                      감정 테스트: 슬픔
                    </option>
                    <option value="새로운 프로젝트를 시작했어!">
                      감정 테스트: 기쁨
                    </option>
                    <option value="안녕하세요! 처음 뵙겠습니다">
                      말투 테스트: 정중함
                    </option>
                    <option value="야 뭐해?">말투 테스트: 친근함</option>
                  </select>
                </div>

                {/* 비교 결과 UI */}
                {beforeResponse && afterResponse && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        변경 전:
                      </div>
                      <div className="text-sm">{beforeResponse}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-600 mb-1">
                        변경 후:
                      </div>
                      <div className="text-sm">{afterResponse}</div>
                    </div>
                  </div>
                )}

                {/* 테스트 버튼들 */}
                <div className="flex gap-2">
                  <button
                    onClick={testSettings}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                  >
                    {loading ? "테스트 중..." : "🧪 성격 설정 테스트"}
                  </button>
                  <button
                    onClick={compareSettings}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
                  >
                    {loading ? "비교 중..." : "🔄 변경 전후 비교"}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "memory" && (
            <>
              {/* 기억 보존 기간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기억 보존 기간 (일)
                </label>
                <select
                  value={settings.memoryRetentionDays}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      memoryRetentionDays: parseInt(e.target.value),
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value={7}>1주일</option>
                  <option value={30}>1개월</option>
                  <option value={90}>3개월</option>
                  <option value={365}>1년</option>
                  <option value={999999}>무제한</option>
                </select>
              </div>

              {/* 기억 중요도 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  기억 중요도 설정
                </label>
                <div className="space-y-4">
                  {[
                    { key: "personal", label: "개인정보 (이름, 가족, 친구)" },
                    { key: "hobby", label: "취미/관심사" },
                    { key: "work", label: "업무/학업" },
                    { key: "emotion", label: "감정상태/고민" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{label}</span>
                        <span className="text-sm font-medium">
                          {
                            settings.memoryPriorities[
                              key as keyof typeof settings.memoryPriorities
                            ]
                          }
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={
                          settings.memoryPriorities[
                            key as keyof typeof settings.memoryPriorities
                          ]
                        }
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            memoryPriorities: {
                              ...prev.memoryPriorities,
                              [key]: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 관심사 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    관심사
                  </label>
                  <button
                    onClick={addInterest}
                    className="text-purple-600 hover:text-purple-700 text-sm"
                  >
                    + 추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.userProfile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {interest}
                      <button
                        onClick={() => removeInterest(index)}
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* 기억 테스트 섹션 추가 */}
              <MemoryTestSection memoryPriorities={settings.memoryPriorities} />
            </>
          )}
        </div>

        {/* 저장 버튼 섹션 - 탭과 관계없이 항상 표시 */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
