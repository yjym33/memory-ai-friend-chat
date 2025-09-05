"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Plus,
  X,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAsyncOperation } from "../../hooks/useAsyncOperation";
import { UploadService, UploadedFile } from "../../services/uploadService";
import { success as toastSuccess, error as toastError } from "../../lib/toast";

interface EnhancedFileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  onFileRemoved?: () => void;
  maxFileSize?: number; // bytes
  allowedTypes?: string[];
  disabled?: boolean;
}

interface FileUploadProgress {
  status:
    | "idle"
    | "validating"
    | "uploading"
    | "processing"
    | "success"
    | "error";
  progress: number;
  message: string;
}

export default function EnhancedFileUpload({
  onFileUploaded,
  onFileRemoved,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  allowedTypes = [
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
  ],
  disabled = false,
}: EnhancedFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress>({
    status: "idle",
    progress: 0,
    message: "",
  });
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    loading,
    execute: executeUpload,
    error: uploadError,
    clearError,
  } = useAsyncOperation<UploadedFile>();

  /**
   * 파일 유효성 검증
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      // 파일 크기 검증
      if (file.size > maxFileSize) {
        return `파일 크기가 ${Math.round(
          maxFileSize / 1024 / 1024
        )}MB를 초과합니다.`;
      }

      if (file.size === 0) {
        return "빈 파일은 업로드할 수 없습니다.";
      }

      // 파일 타입 검증
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        return `지원하지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(
          ", "
        )}`;
      }

      // 파일명 보안 검증
      if (
        file.name.includes("..") ||
        file.name.includes("/") ||
        file.name.includes("\\\\")
      ) {
        return "파일명에 허용되지 않는 문자가 포함되어 있습니다.";
      }

      // 실행 파일 확장자 검증
      const dangerousExtensions = [
        ".exe",
        ".bat",
        ".cmd",
        ".scr",
        ".vbs",
        ".js",
      ];
      if (
        dangerousExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
      ) {
        return "보안상 허용되지 않는 파일 형식입니다.";
      }

      return null;
    },
    [maxFileSize, allowedTypes]
  );

  /**
   * 파일 업로드 처리
   */
  const handleFileUpload = async (file: File) => {
    // 1단계: 유효성 검증
    setUploadProgress({
      status: "validating",
      progress: 10,
      message: "파일 유효성 검사 중...",
    });

    const validationError = validateFile(file);
    if (validationError) {
      setUploadProgress({
        status: "error",
        progress: 0,
        message: validationError,
      });
      toastError(validationError);
      return;
    }

    // 2단계: 업로드 시작
    setUploadProgress({
      status: "uploading",
      progress: 30,
      message: "파일 업로드 중...",
    });

    try {
      const result = await executeUpload(() => UploadService.uploadFile(file), {
        onSuccess: (uploadedFile) => {
          setUploadProgress({
            status: "processing",
            progress: 80,
            message: "서버에서 파일 처리 중...",
          });

          // 약간의 지연 후 완료 상태로 변경 (UX 개선)
          setTimeout(() => {
            setUploadProgress({
              status: "success",
              progress: 100,
              message: "업로드 완료!",
            });

            setUploadedFile(uploadedFile);
            onFileUploaded(uploadedFile);
            toastSuccess(`${file.name} 파일이 성공적으로 업로드되었습니다.`);

            // 3초 후 상태 초기화
            setTimeout(() => {
              setUploadProgress({
                status: "idle",
                progress: 0,
                message: "",
              });
            }, 3000);
          }, 1000);
        },
        onError: (error) => {
          setUploadProgress({
            status: "error",
            progress: 0,
            message: error,
          });
        },
      });
    } catch (error) {
      // 에러는 이미 useAsyncOperation에서 처리됨
    }
  };

  /**
   * 파일 선택 처리
   */
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    clearError();
    await handleFileUpload(file);
  };

  /**
   * 파일 제거
   */
  const handleFileRemove = () => {
    setSelectedFile(null);
    setUploadedFile(null);
    setUploadProgress({
      status: "idle",
      progress: 0,
      message: "",
    });
    clearError();
    onFileRemoved?.();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * 드래그 앤 드롭 처리
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled]
  );

  /**
   * 클릭으로 파일 선택
   */
  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * 진행률 바 색상 결정
   */
  const getProgressColor = () => {
    switch (uploadProgress.status) {
      case "error":
        return "bg-red-500";
      case "success":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  /**
   * 상태 아이콘 결정
   */
  const getStatusIcon = () => {
    switch (uploadProgress.status) {
      case "validating":
        return <Clock className="w-4 h-4 animate-spin" />;
      case "uploading":
      case "processing":
        return <Upload className="w-4 h-4 animate-pulse" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Plus className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        accept={allowedTypes.join(",")}
        className="hidden"
        disabled={disabled}
      />

      {/* 업로드된 파일이 있을 때 */}
      {uploadedFile && uploadProgress.status === "idle" ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <FileText className="w-5 h-5 text-green-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">
              {uploadedFile.originalName}
            </p>
            <p className="text-xs text-green-600">
              {UploadService.formatFileSize(uploadedFile.size)} • 업로드 완료
            </p>
          </div>
          <button
            onClick={handleFileRemove}
            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
            title="파일 제거"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* 파일 업로드 영역 */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-all duration-200 ease-in-out
              ${
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : disabled
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }
              ${
                uploadProgress.status === "error"
                  ? "border-red-300 bg-red-50"
                  : ""
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <div className="flex flex-col items-center gap-2">
              {getStatusIcon()}

              <div className="text-sm">
                {uploadProgress.status === "idle" ? (
                  <>
                    <span className="font-medium text-gray-700">
                      파일을 클릭하거나 드래그하여 업로드
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      최대 {Math.round(maxFileSize / 1024 / 1024)}MB •{" "}
                      {allowedTypes.join(", ")}
                    </p>
                  </>
                ) : (
                  <span
                    className={`font-medium ${
                      uploadProgress.status === "error"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {uploadProgress.message}
                  </span>
                )}
              </div>
            </div>

            {/* 진행률 바 */}
            {uploadProgress.status !== "idle" &&
              uploadProgress.status !== "error" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressColor()}`}
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              )}
          </div>

          {/* 에러 메시지 */}
          {(uploadError || uploadProgress.status === "error") && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {uploadError || uploadProgress.message}
            </div>
          )}

          {/* 선택된 파일 정보 (업로드 중) */}
          {selectedFile &&
            uploadProgress.status !== "idle" &&
            uploadProgress.status !== "error" && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {selectedFile.name}
                  </span>
                  <span className="text-blue-600">
                    ({UploadService.formatFileSize(selectedFile.size)})
                  </span>
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}
