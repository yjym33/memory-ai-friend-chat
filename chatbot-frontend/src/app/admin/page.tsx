"use client";

import { useState } from "react";
import { Crown, Settings, FileText, BarChart3, Upload } from "lucide-react";
import { ChatModeSwitch } from "@/components/ChatModeSwitch";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-2 text-gray-900">
                <Crown className="w-8 h-8 text-yellow-500" />
                <span>관리자 대시보드</span>
              </h1>
              <p className="text-gray-600 mt-1">
                AI 챗봇 시스템의 전체적인 관리와 모니터링을 수행하세요.
              </p>
            </div>

            <div className="px-3 py-1 bg-gray-100 rounded border text-sm text-gray-700">
              관리자 권한
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: "overview", label: "개요", icon: BarChart3 },
              { id: "chat-settings", label: "채팅 설정", icon: Settings },
              { id: "documents", label: "문서 관리", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  시스템 개요
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900">총 사용자</h3>
                    <p className="text-2xl font-bold text-blue-600">1,234</p>
                    <p className="text-xs text-blue-600">
                      +12% from last month
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900">활성 대화</h3>
                    <p className="text-2xl font-bold text-green-600">5,678</p>
                    <p className="text-xs text-green-600">
                      +8% from last month
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-900">
                      업로드된 문서
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">892</p>
                    <p className="text-xs text-purple-600">
                      +23% from last month
                    </p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-medium text-orange-900">검색 쿼리</h3>
                    <p className="text-2xl font-bold text-orange-600">12,456</p>
                    <p className="text-xs text-orange-600">
                      +15% from last month
                    </p>
                  </div>
                </div>

                {/* 시스템 상태 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">
                    시스템 상태
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: "AI 서비스", status: "정상 작동" },
                      { name: "벡터 DB", status: "정상 작동" },
                      { name: "데이터베이스", status: "정상 작동" },
                    ].map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg"
                      >
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-gray-600">
                            {service.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "chat-settings" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  AI 채팅 모드 설정
                </h2>
                <p className="text-gray-600">
                  개인 AI 친구 모드와 기업 쿼리 모드 간 전환을 관리하세요.
                </p>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <ChatModeSwitch
                    onModeChange={(mode) => {
                      console.log("Mode changed to:", mode);
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    문서 관리
                  </h2>
                  <button
                    onClick={() => window.open("/documents", "_blank")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>문서 페이지로 이동</span>
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    문서 업로드
                  </h3>
                  <p className="text-gray-600 mb-4">
                    회사 문서를 업로드하여 AI 검색 시스템에 추가하세요.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    지원 형식: PDF, Word, Excel, 텍스트 파일 (최대 50MB)
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">
                      파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        // 파일 업로드 로직 구현
                        console.log("Files selected:", e.target.files);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
