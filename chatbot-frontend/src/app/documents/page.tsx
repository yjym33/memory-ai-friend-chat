"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, Search, Trash2 } from "lucide-react";

interface Document {
  id: string;
  title: string;
  description?: string;
  type: string;
  originalFileName: string;
  fileSize: number;
  createdAt: string;
  uploadedBy: {
    name: string;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // 문서 목록 조회
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/documents", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("문서 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 문서 검색
  const searchDocuments = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch("/api/documents/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10,
          threshold: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("검색 실패:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // 문서 삭제
  const deleteDocument = async (documentId: string) => {
    if (!confirm("정말 이 문서를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        alert("문서가 삭제되었습니다.");
      }
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("문서 삭제 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      policy: "정책/규정",
      manual: "매뉴얼",
      faq: "FAQ",
      procedure: "절차서",
      regulation: "관리규약",
      contract: "계약서",
      report: "보고서",
      other: "기타",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <FileText className="w-6 h-6 text-blue-500" />
                <span>문서 관리</span>
              </h1>
              <p className="text-gray-600 mt-1">
                회사 문서를 업로드하고 AI 검색 시스템을 관리하세요.
              </p>
            </div>

            <button
              onClick={() => window.open("/admin", "_blank")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>문서 업로드</span>
            </button>
          </div>
        </div>

        {/* 검색 영역 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Search className="w-5 h-5 text-green-500" />
            <span>문서 검색</span>
          </h2>

          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              placeholder="질문을 입력하세요 (예: 휴가 정책이 어떻게 되나요?)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchDocuments()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchDocuments}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? "검색 중..." : "검색"}
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">
                검색 결과 ({searchResults.length}개)
              </h3>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {result.document.title}
                    </h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {(result.score * 100).toFixed(0)}% 일치
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {result.chunk.content.substring(0, 200)}...
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{getDocumentTypeLabel(result.document.type)}</span>
                    <span>•</span>
                    <span>
                      {new Date(result.document.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 문서 목록 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">업로드된 문서</h2>
            <button
              onClick={fetchDocuments}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              새로고침
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-600 mt-2">문서를 불러오는 중...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                문서가 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                첫 번째 문서를 업로드하여 AI 검색 시스템을 시작하세요.
              </p>
              <button
                onClick={() => window.open("/admin", "_blank")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                문서 업로드
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {document.title}
                    </h3>
                    <button
                      onClick={() => deleteDocument(document.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {document.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {document.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {getDocumentTypeLabel(document.type)}
                    </span>
                    <span>
                      {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    <div>
                      {new Date(document.createdAt).toLocaleDateString()}
                    </div>
                    <div>업로드: {document.uploadedBy.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
