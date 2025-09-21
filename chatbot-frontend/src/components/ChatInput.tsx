import React, { useState, useRef } from "react";
import { UploadedFile } from "../services/uploadService";
import EnhancedFileUpload from "./upload/EnhancedFileUpload";
import { ChatMode } from "./ChatModeSwitch";
import { Send, Plus, X, FileText } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  sendMessage: (message?: string, file?: UploadedFile) => void;
  loading: boolean;
  chatMode?: ChatMode;
}

export default function ChatInput({
  input,
  setInput,
  sendMessage,
  loading,
  chatMode = ChatMode.PERSONAL,
}: ChatInputProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileUploaded = (file: UploadedFile) => {
    setUploadedFile(file);
    setShowFileUpload(false);
  };

  const handleFileRemoved = () => {
    setUploadedFile(null);
    setShowFileUpload(false);
  };

  const toggleFileUpload = () => {
    setShowFileUpload(!showFileUpload);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  return (
    <div className="p-2 sm:p-4 bg-white border-t">
      {/* 모드별 힌트 메시지 */}
      {chatMode === ChatMode.BUSINESS && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs text-blue-700 dark:text-blue-300">
          💡 회사 문서에 대해 질문해보세요! (예: "휴가 정책", "보안 규정", "업무
          절차")
        </div>
      )}

      {/* 업로드된 파일 표시 */}
      {uploadedFile && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {uploadedFile.originalName}
                </p>
                <p className="text-xs text-green-600">
                  업로드 완료 • {(uploadedFile.size / 1024).toFixed(1)}KB
                </p>
              </div>
            </div>
            <button
              onClick={handleFileRemoved}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
              title="파일 제거"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 파일 업로드 영역 */}
      {showFileUpload && (
        <div className="mb-3">
          <EnhancedFileUpload
            onFileUploaded={handleFileUploaded}
            onFileRemoved={handleFileRemoved}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* 파일 업로드 버튼 */}
        <button
          onClick={toggleFileUpload}
          disabled={loading}
          className={`
            p-2 sm:p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            ${
              showFileUpload
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }
          `}
          title={showFileUpload ? "파일 업로드 닫기" : "파일 첨부"}
        >
          {showFileUpload ? (
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* 메시지 입력 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              chatMode === ChatMode.PERSONAL
                ? "AI 친구 루나와 대화해보세요... 무엇이든 편하게 말씀해 주세요!"
                : "업로드된 문서에 대해 질문해보세요... (예: 회사 정책, 업무 절차 등)"
            }
            className="w-full p-2 sm:p-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
            rows={1}
            style={{
              minHeight: "40px",
              maxHeight: "120px",
              height: "auto",
            }}
            disabled={loading}
          />
        </div>

        {/* 전송 버튼 */}
        <button
          onClick={handleSendMessage}
          disabled={(!input.trim() && !uploadedFile) || loading}
          className="p-2 sm:p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="메시지 전송"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
          ) : (
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
