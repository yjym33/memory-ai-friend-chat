"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";
import {
  useDocumentList,
  useEmbeddingStatus,
} from "../../hooks/useApiResponse";
import { Document as DocumentType } from "../../types";
import { FileText, Upload, Trash2, RefreshCw, CheckCircle } from "lucide-react";

interface _Document {
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

interface EmbeddingStatus {
  totalChunks: number;
  embeddedChunks: number;
  pendingChunks: number;
  embeddingProgress: number;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { isAuthenticated, token, userType } = useAuthStore();

  // 새로운 API 응답 처리 훅들 사용
  const documentList = useDocumentList();
  const embeddingStatus = useEmbeddingStatus();

  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reprocessingEmbeddings, setReprocessingEmbeddings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 통합된 로딩 상태
  const loading =
    documentList.loading.isLoading || embeddingStatus.loading.isLoading;

  // 권한 확인
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push("/login");
      return;
    }

    if (userType !== "business") {
      alert("기업 사용자만 문서 관리 기능을 사용할 수 있습니다.");
      router.push("/");
      return;
    }
  }, [isAuthenticated, token, userType, router]);

  useEffect(() => {
    if (isAuthenticated && userType === "business") {
      loadData();
    }
  }, [searchTerm, isAuthenticated, userType]);

  const loadData = async () => {
    setError(null);
    try {
      await loadDocuments();
      await loadEmbeddingStatus();
    } catch (error: unknown) {
      console.error("데이터 로딩 실패:", error);
      setError("데이터 로딩에 실패했습니다.");
    }
  };

  const loadDocuments = async () => {
    try {
      const params = new URLSearchParams({
        page: documentList.pagination.currentPage.toString(),
        limit: "20",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const _response = await apiClient.get(`/documents?${params}`);
      documentList.updateData(_response, documentList.pagination.currentPage);
    } catch (error) {
      console.error("문서 목록 로딩 실패:", error);
      documentList.setError("문서 목록을 불러오는데 실패했습니다.");
    }
  };

  const loadEmbeddingStatus = async () => {
    try {
      const response = await apiClient.get("/documents/embedding-status");
      console.log("Embedding Status API Response:", response);
      embeddingStatus.updateData(response);
    } catch (error) {
      console.error("임베딩 상태 로딩 실패:", error);
      embeddingStatus.setError("임베딩 상태를 불러오는데 실패했습니다.");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    console.log(`📤 파일 업로드 시작: ${files.length}개 파일`);

    try {
      for (const file of Array.from(files)) {
        console.log(
          `📄 업로드 중: ${file.name} (${file.type}, ${(
            file.size /
            1024 /
            1024
          ).toFixed(2)}MB)`
        );

        try {
          // 파일 크기 검증 (50MB 제한)
          if (file.size > 50 * 1024 * 1024) {
            throw new Error("파일 크기는 50MB를 초과할 수 없습니다.");
          }

          // 파일 타입 검증
          const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/plain",
          ];

          if (!allowedTypes.includes(file.type)) {
            throw new Error(`지원하지 않는 파일 형식입니다: ${file.type}`);
          }

          const formData = new FormData();
          formData.append("file", file);

          // 안전한 제목 생성
          const safeTitle = file.name
            .replace(/\.[^/.]+$/, "") // 확장자 제거
            .replace(/[^\w\s가-힣.-]/g, "_") // 특수문자를 언더스코어로
            .slice(0, 100); // 길이 제한

          formData.append("title", safeTitle);

          // 파일 타입에 따른 문서 타입 설정
          const fileExt = file.name.split(".").pop()?.toLowerCase();
          let docType = "manual";
          if (fileExt === "pdf") docType = "manual";
          else if (["doc", "docx"].includes(fileExt!)) docType = "procedure";
          else if (["xls", "xlsx"].includes(fileExt!)) docType = "other";
          else if (fileExt === "txt") docType = "faq";

          formData.append("type", docType);
          formData.append(
            "description",
            `기업 사용자가 업로드한 ${docType} 문서: ${file.name} (크기: ${(
              file.size /
              1024 /
              1024
            ).toFixed(2)}MB)`
          );

          console.log(`🚀 API 호출: /documents/upload`);

          const response = await apiClient.post("/documents/upload", formData, {
            timeout: 60000, // 60초 타임아웃
          });

          console.log(`✅ 업로드 성공: ${file.name}`, response);
          successCount++;
        } catch (error: any) {
          console.error(`❌ 업로드 실패: ${file.name}`, error);
          errorCount++;

          let errorMessage = error.message;
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.status) {
            errorMessage = `서버 오류 (${error.response.status}): ${error.response.statusText}`;
          }

          errors.push(`${file.name}: ${errorMessage}`);
        }
      }

      // 결과 메시지 표시
      if (successCount > 0 && errorCount === 0) {
        alert(
          `✅ ${successCount}개 파일이 성공적으로 업로드되었습니다.\n\n문서가 VectorDB에 임베딩되어 기업모드 AI 채팅에서 활용됩니다.`
        );
      } else if (successCount > 0 && errorCount > 0) {
        alert(
          `⚠️ ${successCount}개 파일은 성공, ${errorCount}개 파일은 실패했습니다.\n\n실패한 파일:\n${errors.join(
            "\n"
          )}`
        );
      } else {
        alert(`❌ 모든 파일 업로드에 실패했습니다:\n${errors.join("\n")}`);
      }

      if (successCount > 0) {
        await loadDocuments();
        // 임베딩 상태도 새로고침 (약간의 지연 후)
        setTimeout(() => {
          loadEmbeddingStatus();
        }, 1000);
      }
    } catch (error: any) {
      alert(
        "파일 업로드 중 예상치 못한 오류가 발생했습니다: " +
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

  const handleReprocessEmbeddings = async () => {
    if (
      !confirm(
        "누락된 임베딩을 재처리하시겠습니까? 시간이 오래 걸릴 수 있습니다."
      )
    ) {
      return;
    }

    setReprocessingEmbeddings(true);
    try {
      const response = await apiClient.post("/documents/reprocess-embeddings");
      alert(
        "임베딩 재처리가 시작되었습니다. 완료까지 시간이 걸릴 수 있습니다."
      );

      // 상태 새로고침
      setTimeout(() => {
        loadEmbeddingStatus();
      }, 2000);
    } catch (error: any) {
      alert(
        "임베딩 재처리 실패: " +
          (error.response?.data?.message || error.message)
      );
    }
    setReprocessingEmbeddings(false);
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

  // 권한이 없으면 렌더링하지 않음
  if (!isAuthenticated || !token || userType !== "business") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">문서 관리</h1>
              <p className="text-gray-600 mt-2">
                기업 문서 업로드 및 AI 검색 시스템
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              채팅으로 돌아가기
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    오류 발생
                  </h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setError(null);
                        loadData();
                      }}
                      className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 문서 관리 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  회사 문서 관리
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

              {/* 문서 관리 안내 */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      기업 문서 관리 시스템
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          업로드된 문서는 VectorDB에 임베딩되어 AI 채팅에서
                          활용됩니다
                        </li>
                        <li>지원 파일 형식: PDF, DOC, DOCX, XLS, XLSX, TXT</li>
                        <li>
                          기업모드 채팅에서 질문 시 관련 문서 내용을 참조하여
                          답변합니다
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 임베딩 상태 */}
              {embeddingStatus && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          VectorDB 임베딩 상태
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <span className="font-medium">전체 청크:</span>
                              <div className="text-lg font-bold">
                                {embeddingStatus.data?.totalDocuments || 0}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">임베딩 완료:</span>
                              <div className="text-lg font-bold text-green-600">
                                {embeddingStatus.data?.embeddedDocuments || 0}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">처리 대기:</span>
                              <div className="text-lg font-bold text-orange-600">
                                {embeddingStatus.data?.pendingDocuments || 0}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">진행률:</span>
                              <div className="text-lg font-bold text-blue-600">
                                {Math.round(
                                  ((embeddingStatus.data?.embeddedDocuments ||
                                    0) /
                                    Math.max(
                                      1,
                                      embeddingStatus.data?.totalDocuments || 1
                                    )) *
                                    100
                                )}
                                %
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.round(
                                    ((embeddingStatus.data?.embeddedDocuments ||
                                      0) /
                                      Math.max(
                                        1,
                                        embeddingStatus.data?.totalDocuments ||
                                          1
                                      )) *
                                      100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(embeddingStatus.data?.pendingDocuments || 0) > 0 && (
                      <button
                        onClick={handleReprocessEmbeddings}
                        disabled={reprocessingEmbeddings}
                        className={`inline-flex items-center px-3 py-1 text-xs rounded-md ${
                          reprocessingEmbeddings
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        <RefreshCw
                          className={`w-3 h-3 mr-1 ${
                            reprocessingEmbeddings ? "animate-spin" : ""
                          }`}
                        />
                        {reprocessingEmbeddings ? "재처리 중..." : "재처리"}
                      </button>
                    )}
                  </div>
                </div>
              )}
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
                    {documentList.data.length === 0 ? (
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
                      documentList.data.map((doc) => (
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
                      페이지 {currentPage} /{" "}
                      {documentList.pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(
                          Math.min(
                            documentList.pagination.totalPages,
                            currentPage + 1
                          )
                        )
                      }
                      disabled={
                        currentPage === documentList.pagination.totalPages
                      }
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
      </div>
    </div>
  );
}
