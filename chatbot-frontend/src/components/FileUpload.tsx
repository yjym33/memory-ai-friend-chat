"use client";

import { useState } from "react";
import axios from "axios";
import { success as toastSuccess, error as toastError } from "../lib/toast";

interface FileUploadProps {
  onFileUploaded: (fileInfo: { originalName: string; path: string }) => void;
}

export default function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("파일 업로드 성공:", response.data);
      onFileUploaded(response.data); // 파일 정보를 부모 컴포넌트로 전달
      toastSuccess("파일 업로드 성공!");
      setSelectedFile(null);
    } catch (error) {
      console.error("파일 업로드 실패:", error);
      toastError("파일 업로드 실패!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full">
      <div className="w-full sm:flex-1">
        <label className="flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <span className="text-xs sm:text-sm text-gray-800 truncate">
            {selectedFile ? selectedFile.name : "파일 선택"}
          </span>
          <input type="file" onChange={handleFileChange} className="hidden" />
        </label>
      </div>
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
      >
        {uploading ? "업로드 중..." : "업로드"}
      </button>
    </div>
  );
}
