import { useAuthStore } from "../store/authStore";

export interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  size: number;
}

export interface FileUploadResponse {
  originalName: string;
  filename: string;
  path: string;
  size: number;
}

/**
 * 파일 업로드 서비스
 */
export class UploadService {
  /**
   * 파일을 서버에 업로드합니다.
   * @param file - 업로드할 파일
   * @returns 업로드된 파일 정보
   */
  static async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    // 토큰 가져오기 (Zustand 스토어에서)
    const token = useAuthStore.getState().token;

    if (!token) {
      throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            // Authorization 헤더 추가
            Authorization: `Bearer ${token}`,
            // 'Content-Type': 'multipart/form-data' 헤더는 자동으로 설정됩니다
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("파일 업로드 실패:", error);
      throw error;
    }
  }

  /**
   * 지원되는 파일 형식인지 확인합니다.
   * @param file - 확인할 파일
   * @returns 지원 여부
   */
  static isSupportedFileType(file: File): boolean {
    const supportedTypes = [
      // 이미지
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      // 문서
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      // 스프레드시트
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // 프레젠테이션
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    const supportedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".pdf",
      ".doc",
      ".docx",
      ".txt",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
    ];

    const hasValidType = supportedTypes.includes(file.type);
    const hasValidExtension = supportedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    return hasValidType || hasValidExtension;
  }

  /**
   * 파일 크기를 사람이 읽기 쉬운 형식으로 변환합니다.
   * @param bytes - 바이트 크기
   * @returns 포맷된 크기 문자열
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * 파일 확장자를 기반으로 파일 유형을 반환합니다.
   * @param filename - 파일명
   * @returns 파일 유형
   */
  static getFileType(filename: string): string {
    const extension = filename.toLowerCase().split(".").pop();

    switch (extension) {
      case "pdf":
        return "PDF 문서";
      case "doc":
      case "docx":
        return "Word 문서";
      case "xls":
      case "xlsx":
        return "Excel 스프레드시트";
      case "ppt":
      case "pptx":
        return "PowerPoint 프레젠테이션";
      case "txt":
        return "텍스트 파일";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "이미지 파일";
      default:
        return "문서 파일";
    }
  }
}

export default UploadService;
