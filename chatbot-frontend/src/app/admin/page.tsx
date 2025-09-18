"use client";

import { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient";
import {
  Users,
  Settings,
  BarChart3,
  Building2,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  FileText,
  Upload,
  Search,
  Trash2,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  userType: "individual" | "business";
  role: string;
  createdAt: string;
  businessProfile: any;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

interface Statistics {
  totalUsers: number;
  individualUsers: number;
  businessUsers: number;
  totalOrganizations: number;
  recentUsers: number;
  userTypeDistribution: {
    individual: number;
    business: number;
  };
}

interface Document {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
  };
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  type: string;
  subscriptionTier: string;
  domain?: string;
  createdAt: string;
  users: User[];
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUserType, setFilterUserType] = useState<
    "all" | "individual" | "business"
  >("all");
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, currentPage, searchTerm, filterUserType]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        await loadUsers();
      } else if (activeTab === "statistics") {
        await loadStatistics();
      } else if (activeTab === "documents") {
        await loadDocuments();
      } else if (activeTab === "organizations") {
        await loadOrganizations();
      }
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }
      if (filterUserType !== "all") {
        params.append("userType", filterUserType);
      }

      const response = await apiClient.get(`/admin/users?${params}`);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("사용자 목록 로딩 실패:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await apiClient.get("/admin/statistics");
      setStatistics(response.data);
    } catch (error) {
      console.error("통계 로딩 실패:", error);
    }
  };

  const loadDocuments = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await apiClient.get(`/documents?${params}`);
      setDocuments(response.data.documents || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("문서 목록 로딩 실패:", error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await apiClient.get("/admin/organizations");
      setOrganizations(response.data || []);
    } catch (error) {
      console.error("조직 목록 로딩 실패:", error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        formData.append("type", "manual"); // 기본 타입
        formData.append("description", `관리자가 업로드한 문서: ${file.name}`);

        await apiClient.post("/documents/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      alert(`${files.length}개 파일이 성공적으로 업로드되었습니다.`);
      await loadDocuments();
    } catch (error: any) {
      alert(
        "파일 업로드에 실패했습니다: " +
          (error.response?.data?.message || error.message)
      );
    }
    setUploadingFile(false);
    // 파일 입력 초기화
    event.target.value = "";
  };

  const handleDeleteDocument = async (documentId: string, title: string) => {
    if (!confirm(`"${title}" 문서를 삭제하시겠습니까?`)) return;

    try {
      await apiClient.delete(`/documents/${documentId}`);
      alert("문서가 삭제되었습니다.");
      await loadDocuments();
    } catch (error: any) {
      alert(
        "문서 삭제에 실패했습니다: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleUserTypeChange = async (
    userId: string,
    newUserType: "individual" | "business"
  ) => {
    try {
      const reason = prompt(
        `사용자를 ${
          newUserType === "business" ? "기업" : "개인"
        } 사용자로 변경하는 이유를 입력하세요:`
      );
      if (!reason) return;

      await apiClient.put(`/admin/users/${userId}/type`, {
        userType: newUserType,
        reason,
      });

      alert(
        `사용자 유형이 ${
          newUserType === "business" ? "기업" : "개인"
        } 사용자로 변경되었습니다.`
      );
      await loadUsers();
    } catch (error: any) {
      alert(
        "사용자 유형 변경에 실패했습니다: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleBusinessModeToggle = async (userId: string, approve: boolean) => {
    try {
      const reason = prompt(
        `기업 모드를 ${approve ? "승인" : "취소"}하는 이유를 입력하세요:`
      );
      if (!reason) return;

      if (approve) {
        await apiClient.post(`/admin/users/${userId}/approve-business`, {
          reason,
        });
        alert("기업 모드가 승인되었습니다.");
      } else {
        await apiClient.delete(`/admin/users/${userId}/revoke-business`, {
          data: { reason },
        });
        alert("기업 모드 승인이 취소되었습니다.");
      }

      await loadUsers();
    } catch (error: any) {
      alert(
        "기업 모드 상태 변경에 실패했습니다: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserTypeColor = (userType: string) => {
    return userType === "business"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800";
  };

  const getRoleColor = (role: string) => {
    const colors = {
      super_admin: "bg-red-100 text-red-800",
      admin: "bg-orange-100 text-orange-800",
      org_admin: "bg-purple-100 text-purple-800",
      org_member: "bg-green-100 text-green-800",
      user: "bg-gray-100 text-gray-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-600 mt-2">시스템 사용자 및 조직 관리</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "users", name: "사용자 관리", icon: Users },
                { id: "documents", name: "문서 관리", icon: FileText },
                { id: "statistics", name: "통계", icon: BarChart3 },
                { id: "organizations", name: "조직 관리", icon: Building2 },
                { id: "settings", name: "설정", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 사용자 관리 탭 */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  사용자 목록
                </h2>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="이메일 또는 이름 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filterUserType}
                    onChange={(e) => setFilterUserType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">모든 사용자</option>
                    <option value="individual">개인 사용자</option>
                    <option value="business">기업 사용자</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">로딩 중...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          사용자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          유형
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          역할
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          조직
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          기업 모드
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          가입일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeColor(
                                user.userType
                              )}`}
                            >
                              {user.userType === "business" ? "기업" : "개인"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.organization?.name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.userType === "business" ? (
                              <div className="flex items-center space-x-2">
                                {user.businessProfile?.businessModeApproved ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span
                                  className={`text-xs ${
                                    user.businessProfile?.businessModeApproved
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {user.businessProfile?.businessModeApproved
                                    ? "승인됨"
                                    : "미승인"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                해당없음
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() =>
                                handleUserTypeChange(
                                  user.id,
                                  user.userType === "business"
                                    ? "individual"
                                    : "business"
                                )
                              }
                              className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                                user.userType === "business"
                                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              }`}
                            >
                              {user.userType === "business" ? (
                                <>
                                  <UserX className="w-3 h-3 mr-1" />
                                  개인전환
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  기업전환
                                </>
                              )}
                            </button>
                            {user.userType === "business" && (
                              <button
                                onClick={() =>
                                  handleBusinessModeToggle(
                                    user.id,
                                    !user.businessProfile?.businessModeApproved
                                  )
                                }
                                className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                                  user.businessProfile?.businessModeApproved
                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                }`}
                              >
                                {user.businessProfile?.businessModeApproved
                                  ? "승인취소"
                                  : "승인"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      <span className="text-sm text-gray-700">
                        페이지 {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 통계 탭 */}
        {activeTab === "statistics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statistics && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        전체 사용자
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {statistics.totalUsers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <UserCheck className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        개인 사용자
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {statistics.individualUsers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <Building2 className="w-8 h-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        기업 사용자
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {statistics.businessUsers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <BarChart3 className="w-8 h-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        전체 조직
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {statistics.totalOrganizations}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        최근 7일 가입
                      </p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {statistics.recentUsers}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    사용자 유형 분포
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">개인 사용자</span>
                      <span className="text-sm font-semibold">
                        {statistics.userTypeDistribution.individual}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${statistics.userTypeDistribution.individual}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">기업 사용자</span>
                      <span className="text-sm font-semibold">
                        {statistics.userTypeDistribution.business}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${statistics.userTypeDistribution.business}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 문서 관리 탭 */}
        {activeTab === "documents" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  문서 관리
                </h2>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="문서 제목 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={uploadingFile}
                    />
                    <label
                      htmlFor="file-upload"
                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        uploadingFile
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      }`}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingFile ? "업로드 중..." : "문서 업로드"}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">로딩 중...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          문서명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          타입
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          파일 크기
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          업로드자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          업로드일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center">
                            <div className="flex flex-col items-center">
                              <FileText className="w-12 h-12 text-gray-400 mb-4" />
                              <p className="text-gray-500 text-lg font-medium mb-2">
                                업로드된 문서가 없습니다
                              </p>
                              <p className="text-gray-400 text-sm">
                                문서를 업로드하여 AI 검색 시스템에 추가하세요
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {doc.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {doc.originalFileName}
                                </div>
                                {doc.description && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    {doc.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {doc.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  doc.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : doc.status === "draft"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {doc.status === "active"
                                  ? "활성"
                                  : doc.status === "draft"
                                  ? "초안"
                                  : doc.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {doc.uploadedBy?.name || "알 수 없음"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {doc.uploadedBy?.email || ""}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(doc.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() =>
                                  handleDeleteDocument(doc.id, doc.title)
                                }
                                className="inline-flex items-center px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      <span className="text-sm text-gray-700">
                        페이지 {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 조직 관리 탭 */}
        {activeTab === "organizations" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">조직 관리</h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-500">로딩 중...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {organizations.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      등록된 조직이 없습니다
                    </p>
                    <p className="text-gray-400 text-sm">
                      기업 사용자가 가입하면 조직이 표시됩니다
                    </p>
                  </div>
                ) : (
                  organizations.map((org) => (
                    <div
                      key={org.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {org.name}
                          </h3>
                          {org.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {org.description}
                            </p>
                          )}
                          {org.domain && (
                            <p className="text-xs text-gray-500">
                              도메인: {org.domain}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {org.type}
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {org.subscriptionTier}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">사용자</span>
                          <span className="font-medium text-gray-900">
                            {org.users.length}명
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-500">생성일</span>
                          <span className="text-gray-900">
                            {formatDate(org.createdAt)}
                          </span>
                        </div>
                      </div>

                      {org.users.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-2">구성원</p>
                          <div className="space-y-1">
                            {org.users.slice(0, 3).map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center text-xs"
                              >
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                <span className="text-gray-700">
                                  {user.name} ({user.email})
                                </span>
                              </div>
                            ))}
                            {org.users.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{org.users.length - 3}명 더
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* 설정 탭은 추후 구현 */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-500">이 기능은 곧 구현될 예정입니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
