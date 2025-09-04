import React, { useState, useRef } from "react";
import { UploadService, UploadedFile } from "../services/uploadService";
import { success as toastSuccess, error as toastError } from "../lib/toast";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  sendMessage: (message?: string, file?: UploadedFile) => void;
  loading: boolean;
}

export default function ChatInput({
  input,
  setInput,
  sendMessage,
  loading,
}: ChatInputProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 유형 검증
    if (!UploadService.isSupportedFileType(file)) {
      toastError(
        "지원하지 않는 파일 형식입니다. PDF, Word, Excel, PowerPoint, 이미지 파일만 업로드 가능합니다."
      );
      return;
    }

    // 파일 크기 검증 (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toastError("파일 크기가 100MB를 초과합니다.");
      return;
    }

    setUploading(true);
    try {
      const fileInfo = await UploadService.uploadFile(file);
      setUploadedFile(fileInfo);
      toastSuccess(`${file.name} 파일이 업로드되었습니다.`);
    } catch (error) {
      console.error("파일 업로드 실패:", error);
      toastError("파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSendMessage = () => {
    if (uploadedFile) {
      // 파일과 함께 메시지 전송
      sendMessage(input || "파일을 첨부했습니다.", uploadedFile);
      setUploadedFile(null);
    } else {
      // 일반 메시지 전송
      sendMessage(input);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };
  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-center bg-gradient-to-r from-white/80 to-purple-50/80 py-4 border-t border-gray-200 z-10">
      <div className="max-w-2xl w-full px-4">
        {/* 업로드된 파일 표시 */}
        {uploadedFile && (
          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-blue-800">
                    {uploadedFile.originalName}
                  </span>
                  <span className="text-xs text-blue-600">
                    {UploadService.getFileType(uploadedFile.originalName)} •{" "}
                    {UploadService.formatFileSize(uploadedFile.size)}
                  </span>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-blue-400 hover:text-blue-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 입력창 및 버튼들 */}
        <div className="flex items-end gap-2">
          {/* 파일 첨부 버튼 */}
          <button
            onClick={handleFileSelect}
            disabled={loading || uploading}
            className="p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 shadow-sm"
            title="파일 첨부"
          >
            {uploading ? (
              <svg
                className="w-5 h-5 text-gray-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            )}
          </button>

          {/* 텍스트 입력창 */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="루나에게 메시지를 보내세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow text-gray-900"
              disabled={loading}
            />
          </div>

          {/* 전송 버튼 */}
          <button
            className="px-5 py-3 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold shadow hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-50"
            onClick={handleSendMessage}
            disabled={loading || (!input.trim() && !uploadedFile)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
          className="hidden"
        />
      </div>
    </div>
  );
}
